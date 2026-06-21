//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.supabase.createClient(
  "https://duznidzlfvadjcoxynjh.supabase.co",
  "sb_publishable_3UzY44NnUmIi795wKqr2Kg_G0LBpJp4"
);


//////////////////////////////////////////////////////
// CLASSIFICATION ENGINE (PHASE 4 STEP 2)
//////////////////////////////////////////////////////

function classifyTransaction(description, type) {

  let classification = "NON_EBM";

  const desc = (description || "").toLowerCase();

  // PAYE
  if (desc.includes("salary")) {
    classification = "PAYE";
  }

  // WITHHOLDING TAX
  else if (desc.includes("service")) {
    classification = "WITHHOLDING_TAX";
  }

  // EBM
  else if (desc.includes("ebm")) {
    classification = "EBM";
  }

  // EXPENSE DEFAULT
  else if (type === "expense") {
    classification = "NON_EBM";
  }

  return classification;
}


//////////////////////////////////////////////////////
// MAIN ENTRY POINT
//////////////////////////////////////////////////////

async function submitTransaction() {

  const description = document.getElementById("description").value;
  const reference = document.getElementById("reference").value;
  const date = document.getElementById("date").value;
  const type = document.getElementById("type").value;
  const amount = Number(document.getElementById("amount").value);
  const accountId = document.getElementById("account").value;

  if (!description || !date || !amount || !accountId) {
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
  // STEP 2 → CLASSIFY TRANSACTION (NEW)
  //////////////////////////////////////////////////////

  const classification = classifyTransaction(description, type);

  console.log("Classification:", classification);


  //////////////////////////////////////////////////////
  // BUILD DOUBLE ENTRY
  //////////////////////////////////////////////////////

  let lines = [];

  if (type === "expense") {

    lines = [
      {
        account_id: accountId,
        debit: amount,
        credit: 0,
        description
      },
      {
        account_id: await getCashAccount(company.id),
        debit: 0,
        credit: amount,
        description
      }
    ];
  }

  else if (type === "income") {

    lines = [
      {
        account_id: await getCashAccount(company.id),
        debit: amount,
        credit: 0,
        description
      },
      {
        account_id: accountId,
        debit: 0,
        credit: amount,
        description
      }
    ];
  }

  else if (type === "transfer") {

    lines = [
      {
        account_id: accountId,
        debit: amount,
        credit: 0,
        description
      }
    ];
  }


  //////////////////////////////////////////////////////
  // SAVE JOURNAL ENTRY
  //////////////////////////////////////////////////////

  try {

    await createJournalEntry({
      companyId: company.id,
      entryDate: date,
      description: description + " [" + classification + "]",
      reference,
      lines
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
// JOURNAL ENGINE CORE
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
// MESSAGE
//////////////////////////////////////////////////////

function showMsg(msg) {
  document.getElementById("msg").innerText = msg;
}
