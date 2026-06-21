//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.supabase.createClient(
  "https://duznidzlfvadjcoxynjh.supabase.co",
  "sb_publishable_3UzY44NnUmIi795wKqr2Kg_G0LBpJp4"
);

//////////////////////////////////////////////////////
// 🧠 PHASE 4 STEP 2 — CLASSIFICATION ENGINE
//////////////////////////////////////////////////////

function classifyTransaction(description, type) {

  let classification = "NON_EBM";
  const desc = (description || "").toLowerCase();

  if (desc.includes("salary")) {
    classification = "PAYE";
  } 
  else if (desc.includes("service")) {
    classification = "WITHHOLDING_TAX";
  } 
  else if (desc.includes("ebm")) {
    classification = "EBM";
  } 
  else if (type === "expense") {
    classification = "NON_EBM";
  }

  return classification;
}

//////////////////////////////////////////////////////
// 🧠 PHASE 4 STEP 3 — SAVE CLASSIFICATION
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
// 🧠 PHASE 5 STEP 1 — AI ACCOUNT SUGGESTION ENGINE
//////////////////////////////////////////////////////

function suggestAccount(description, type) {

  const desc = (description || "").toLowerCase();

  if (desc.includes("salary")) return { account_code: "5001", reason: "Payroll detected" };
  if (desc.includes("rent")) return { account_code: "6001", reason: "Rent detected" };
  if (desc.includes("fuel")) return { account_code: "6002", reason: "Transport detected" };

  return { account_code: "1000", reason: "Default cash mapping" };
}

//////////////////////////////////////////////////////
// 🧠 PHASE 5 STEP 2 — FRAUD DETECTION ENGINE
//////////////////////////////////////////////////////

function detectFraud({ description, amount, type }) {

  const desc = (description || "").toLowerCase();

  let riskScore = 0;
  let flags = [];

  if (amount > 1000000) {
    riskScore += 2;
    flags.push("High value transaction");
  }

  if (desc.includes("refund") && desc.includes("cash")) {
    riskScore += 2;
    flags.push("Refund/Cash anomaly");
  }

  if (desc.includes("salary") && amount % 100 !== 0) {
    riskScore += 1;
    flags.push("Irregular salary pattern");
  }

  if (type === "transfer" && amount > 500000) {
    riskScore += 2;
    flags.push("Large transfer detected");
  }

  let level = "LOW";
  if (riskScore >= 4) level = "HIGH";
  else if (riskScore >= 2) level = "MEDIUM";

  return { riskScore, level, flags };
}

//////////////////////////////////////////////////////
// 🧠 MAIN ENTRY POINT (ERP CORE ENGINE)
//////////////////////////////////////////////////////

async function submitTransaction() {

  const description = document.getElementById("description").value;
  const reference = document.getElementById("reference").value;
  const date = document.getElementById("date").value;
  const type = document.getElementById("type").value;
  const amount = Number(document.getElementById("amount").value);
  const accountIdManual = document.getElementById("account").value;

  if (!description || !date || !amount) {
    showMsg("Fill all required fields");
    return;
  }

  const { data: sessionData } = await sb.auth.getSession();
  const user = sessionData.session.user;

  const { data: company } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();

  //////////////////////////////////////////////////////
  // CLASSIFICATION ENGINE
  //////////////////////////////////////////////////////

  const classification = classifyTransaction(description, type);

  //////////////////////////////////////////////////////
  // AI SUGGESTION ENGINE
  //////////////////////////////////////////////////////

  const suggestion = suggestAccount(description, type);

  console.log("AI Suggestion:", suggestion);

  //////////////////////////////////////////////////////
  // FRAUD DETECTION ENGINE
  //////////////////////////////////////////////////////

  const fraud = detectFraud({
    description,
    amount,
    type
  });

  console.log("Fraud:", fraud);

  if (fraud.level === "HIGH") {
    showMsg("🚨 High Risk Transaction Detected!");
  }

  //////////////////////////////////////////////////////
  // ACCOUNT RESOLUTION
  //////////////////////////////////////////////////////

  const accountId =
    accountIdManual ||
    await getAccountByCode(company.id, suggestion.account_code);

  //////////////////////////////////////////////////////
  // BUILD DOUBLE ENTRY
  //////////////////////////////////////////////////////

  let lines = [];

  if (type === "expense") {

    lines = [
      { account_id: accountId, debit: amount, credit: 0, description },
      { account_id: await getCashAccount(company.id), debit: 0, credit: amount, description }
    ];
  }

  else if (type === "income") {

    lines = [
      { account_id: await getCashAccount(company.id), debit: amount, credit: 0, description },
      { account_id: accountId, debit: 0, credit: amount, description }
    ];
  }

  else if (type === "transfer") {

    lines = [
      { account_id: accountId, debit: amount, credit: 0, description }
    ];
  }

  //////////////////////////////////////////////////////
  // CREATE JOURNAL ENTRY
  //////////////////////////////////////////////////////

  try {

    const entry = await createJournalEntry({
      companyId: company.id,
      entryDate: date,
      description: description + " [" + classification + "]",
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
// CASH ACCOUNT
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

//////////////////////////////////////////////////////
// GET ACCOUNT BY CODE
//////////////////////////////////////////////////////

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
// CORE DOUBLE ENTRY ENGINE
//////////////////////////////////////////////////////

async function createJournalEntry({
  companyId,
  entryDate,
  description,
  reference,
  lines
}) {

  let totalDebit = 0;
  let totalCredit = 0;

  lines.forEach(l => {
    totalDebit += Number(l.debit || 0);
    totalCredit += Number(l.credit || 0);
  });

  if (totalDebit !== totalCredit) {
    throw new Error("Unbalanced Entry!");
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
// UI MESSAGE
//////////////////////////////////////////////////////

function showMsg(msg) {
  document.getElementById("msg").innerText = msg;
}
