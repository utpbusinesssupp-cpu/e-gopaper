//////////////////////////////////////////////////////
// SUPABASE
//////////////////////////////////////////////////////

const sb = window.supabase.createClient(
  "https://duznidzlfvadjcoxynjh.supabase.co",
  "sb_publishable_3UzY44NnUmIi795wKqr2Kg_G0LBpJp4"
);


//////////////////////////////////////////////////////
// INIT
//////////////////////////////////////////////////////

init();

async function init() {

  const { data: sessionData }
    = await sb.auth.getSession();

  if (!sessionData.session) {

    window.location.href = "index.html";

    return;

  }

  const user = sessionData.session.user;


  const { data: company } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();


  await loadIncomeStatement(company.id);

}


//////////////////////////////////////////////////////
// LOAD P&L
//////////////////////////////////////////////////////

async function loadIncomeStatement(companyId) {

  const { data, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(
        account_type
      )
    `)
    .eq("company_id", companyId);


  if (error) {

    console.log(error.message);

    return;

  }


  let revenue = 0;

  let expenses = 0;


  data.forEach(line => {

    const type =
      line.chart_of_accounts.account_type;


    ////////////////////////////////////////////////////
    // REVENUE
    ////////////////////////////////////////////////////

    if (type === "Revenue") {

      revenue += Number(line.credit || 0);

    }


    ////////////////////////////////////////////////////
    // EXPENSE
    ////////////////////////////////////////////////////

    if (type === "Expense") {

      expenses += Number(line.debit || 0);

    }

  });


  const netProfit =
    revenue - expenses;


  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  document.getElementById("totalRevenue")
    .innerText =
      revenue.toLocaleString() + " RWF";

  document.getElementById("totalExpenses")
    .innerText =
      expenses.toLocaleString() + " RWF";

  document.getElementById("netProfit")
    .innerText =
      netProfit.toLocaleString() + " RWF";

}
