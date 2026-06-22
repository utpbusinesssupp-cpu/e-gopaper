//////////////////////////////////////////////////////
// SUPABASE CLIENT (GLOBAL STANDARD)
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// INCOME STATEMENT ENGINE (V1 FINAL)
//////////////////////////////////////////////////////

async function loadIncomeStatement(companyId) {

  //////////////////////////////////////////////////////
  // FETCH JOURNAL LINES (MULTI-TENANT SAFE)
  //////////////////////////////////////////////////////

  const { data, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(account_type)
    `)
    .eq("company_id", companyId);

  if (error) {
    console.log("Income Statement Error:", error.message);
    return;
  }

  //////////////////////////////////////////////////////
  // INITIAL VALUES
  //////////////////////////////////////////////////////

  let revenue = 0;
  let expenses = 0;

  //////////////////////////////////////////////////////
  // CALCULATION ENGINE (SAFE NULL + TYPE CHECK)
  //////////////////////////////////////////////////////

  (data || []).forEach(l => {

    const type = l.chart_of_accounts?.account_type;

    if (!type) return;

    switch (type) {

      case "Revenue":
        revenue += Number(l.credit || 0);
        break;

      case "Expense":
        expenses += Number(l.debit || 0);
        break;
    }
  });

  //////////////////////////////////////////////////////
  // PROFIT CALCULATION
  //////////////////////////////////////////////////////

  const profit = revenue - expenses;

  //////////////////////////////////////////////////////
  // RESULT OBJECT (CLEAN ERP OUTPUT)
  //////////////////////////////////////////////////////

  const result = {
    revenue,
    expenses,
    profit,
    margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    status: profit >= 0 ? "PROFITABLE ✔" : "LOSS ❌"
  };

  //////////////////////////////////////////////////////
  // LOG OUTPUT
  //////////////////////////////////////////////////////

  console.log("📊 INCOME STATEMENT");
  console.log(result);

  //////////////////////////////////////////////////////
  // OPTIONAL UI INJECTION (SAFE)
  //////////////////////////////////////////////////////

  if (document.getElementById("revenue")) {
    document.getElementById("revenue").innerText =
      revenue.toLocaleString();
  }

  if (document.getElementById("expenses")) {
    document.getElementById("expenses").innerText =
      expenses.toLocaleString();
  }

  if (document.getElementById("profit")) {
    document.getElementById("profit").innerText =
      profit.toLocaleString();
  }

  if (document.getElementById("profitStatus")) {
    document.getElementById("profitStatus").innerText =
      result.status;
  }

  return result;
}

//////////////////////////////////////////////////////
// AUTO RUN (SAFE ENTRY)
//////////////////////////////////////////////////////

(async () => {

  const { data: session } = await sb.auth.getSession();

  const user = session?.session?.user;
  if (!user) return;

  const { data: company } = await sb
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!company) return;

  await loadIncomeStatement(company.id);

})();
