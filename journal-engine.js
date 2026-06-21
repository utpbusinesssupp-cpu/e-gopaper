//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.supabase.createClient(
  "https://duznidzlfvadjcoxynjh.supabase.co",
  "sb_publishable_3UzY44NnUmIi795wKqr2Kg_G0LBpJp4"
);

//////////////////////////////////////////////////////
// 🧠 CLASSIFICATION ENGINE (PHASE 4)
//////////////////////////////////////////////////////

function classifyTransaction(description, type) {

  const desc = (description || "").toLowerCase();

  if (desc.includes("salary")) return "PAYE";
  if (desc.includes("service")) return "WITHHOLDING_TAX";
  if (desc.includes("ebm")) return "EBM";

  if (type === "expense") return "NON_EBM";

  return "GENERAL";
}

//////////////////////////////////////////////////////
// 🧠 SAVE CLASSIFICATION
//////////////////////////////////////////////////////

async function saveClassification({
  companyId,
  journalEntryId,
  classification,
  description
}) {

  const { error } = await sb
    .from("transaction_classification")
    .insert([{
      company_id: companyId,
      journal_entry_id: journalEntryId,
      classification_type: classification,
      description
    }]);

  if (error) console.log("Classification error:", error.message);
}

//////////////////////////////////////////////////////
// 🧠 AI ACCOUNT SUGGESTION (PHASE 5)
//////////////////////////////////////////////////////

function suggestAccount(description) {

  const desc = (description || "").toLowerCase();

  if (desc.includes("salary")) return { code: "5001", reason: "Payroll" };
  if (desc.includes("rent")) return { code: "6001", reason: "Rent expense" };
  if (desc.includes("fuel")) return { code: "6002", reason: "Transport expense" };

  return { code: "1000", reason: "Default cash account" };
}

//////////////////////////////////////////////////////
// 🧠 FRAUD DETECTION ENGINE
//////////////////////////////////////////////////////

function detectFraud({ description, amount, type }) {

  const desc = (description || "").toLowerCase();

  let score = 0;
  let flags = [];

  if (amount > 1000000) {
    score += 2;
    flags.push("High value transaction");
  }

  if (desc.includes("refund") && desc.includes("cash")) {
    score += 2;
    flags.push("Refund anomaly");
  }

  if (type === "transfer" && amount > 500000) {
    score += 2;
    flags.push("Large transfer");
  }

  let level = "LOW";
  if (score >= 4) level = "HIGH";
  else if (score >= 2) level = "MEDIUM";

  return { score, level, flags };
}

//////////////////////////////////////////////////////
// 🧠 MAIN ENTRY POINT
//////////////////////////////////////////////////////

async function submitTransaction() {

  const description = document.getElementById("description").value;
  const reference = document.getElementById("reference").value;
  const date = document.getElementById("date").value;
  const type = document.getElementById("type").value;
  const amount = Number(document.getElementById("amount").value);
  const manualAccount = document.getElementById("account").value;

  if (!description || !date || !amount) {
    showMsg("Fill all required fields");
    return;
  }

  //////////////////////////////////////////////////////
  // SESSION + COMPANY
  //////////////////////////////////////////////////////

  const { data: sessionData } = await sb.auth.getSession();
  const user = sessionData.session.user;

  const { data: company } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();

  //////////////////////////////////////////////////////
  // AI LAYERS
  //////////////////////////////////////////////////////

  const classification = classifyTransaction(description, type);
  const suggestion = suggestAccount(description);
  const fraud = detectFraud({ description, amount, type });

  console.log("AI Suggestion:", suggestion);
  console.log("Fraud:", fraud);

  if (fraud.level === "HIGH") {
    showMsg("🚨 High Risk Transaction Detected!");
  }

  //////////////////////////////////////////////////////
  // RESOLVE ACCOUNT
  //////////////////////////////////////////////////////

  const accountId =
    manualAccount ||
    await getAccountByCode(company.id, suggestion.code);

  //////////////////////////////////////////////////////
  // BUILD DOUBLE ENTRY
  //////////////////////////////////////////////////////

  const cashAccount = await getCashAccount(company.id);

  let lines = [];

  if (type === "expense") {

    lines = [
      { account_id: accountId, debit: amount, credit: 0, description },
      { account_id: cashAccount, debit: 0, credit: amount, description }
    ];

  } else if (type === "income") {

    lines = [
      { account_id: cashAccount, debit: amount, credit: 0, description },
      { account_id: accountId, debit: 0, credit: amount, description }
    ];

  } else {

    lines = [
      { account_id: accountId, debit: amount, credit: 0, description }
    ];
  }

  //////////////////////////////////////////////////////
  // POST JOURNAL ENTRY
  //////////////////////////////////////////////////////

  try {

    const entry = await createJournalEntry({
      companyId: company.id,
      entryDate: date,
      description: `${description} [${classification}]`,
      reference,
      lines
    });

    //////////////////////////////////////////////////////
    // SAVE CLASSIFICATION
    //////////////////////////////////////////////////////

    await saveClassification({
      companyId: company.id,
      journalEntryId: entry.id,
      classification,
      description
    });

    showMsg("Transaction posted ✔");

  } catch (err) {
    showMsg(err.message);
  }
}

//////////////////////////////////////////////////////
// 🧠 HELPERS
//////////////////////////////////////////////////////

async function getCashAccount(companyId) {

  const { data } = await sb
    .from("chart_of_accounts")
    .select("id")
    .eq("company_id", companyId)
    .eq("account_code", "1000")
    .single();

  return data.id;
}

async function getAccountByCode(companyId, code) {

  const { data } = await sb
    .from("chart_of_accounts")
    .select("id")
    .eq("company_id", companyId)
    .eq("account_code", code)
    .single();

  return data.id;
}

//////////////////////////////////////////////////////
// 🧠 DOUBLE ENTRY ENGINE (CORE SAFE VERSION)
//////////////////////////////////////////////////////

async function createJournalEntry({
  companyId,
  entryDate,
  description,
  reference,
  lines
}) {

  let debit = 0;
  let credit = 0;

  lines.forEach(l => {
    debit += Number(l.debit || 0);
    credit += Number(l.credit || 0);
  });

  if (debit !== credit) {
    throw new Error(`Unbalanced Entry: ${debit} ≠ ${credit}`);
  }

  const { data: entry, error } = await sb
    .from("journal_entries")
    .insert([{
      company_id: companyId,
      entry_date: entryDate,
      description,
      reference,
      status: "POSTED"
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  const formatted = lines.map(l => ({
    journal_entry_id: entry.id,
    company_id: companyId,
    account_id: l.account_id,
    debit: l.debit,
    credit: l.credit,
    description: l.description
  }));

  const { error: lineError } = await sb
    .from("journal_lines")
    .insert(formatted);

  if (lineError) throw new Error(lineError.message);

  return entry;
}

//////////////////////////////////////////////////////
// 🧠 UI MESSAGE
//////////////////////////////////////////////////////

function showMsg(msg) {
  document.getElementById("msg").innerText = msg;
}
