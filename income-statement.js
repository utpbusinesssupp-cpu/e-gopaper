//////////////////////////////////////////////////////
// SUPABASE INIT
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

  const { data: sessionData } = await sb.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  const user = sessionData.session.user;


  //////////////////////////////////////////////////////
  // GET COMPANY
  //////////////////////////////////////////////////////

  const { data: company } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();


  //////////////////////////////////////////////////////
  // GET JOURNAL LINES
  //////////////////////////////////////////////////////

  const { data: lines, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts (
        account_type,
        account_name
      )
    `)
    .eq("company_id", company.id);

  if (error) {
    alert(error.message);
    return;
  }


  //////////////////////////////////////////////////////
  // CALCULATE INCOME STATEMENT
  //////////////////////////////////////////////////////

  let revenue = 0;
  let expenses = 0;

  lines.forEach(line => {

    const type = line.chart_of_accounts?.account_type;

    if (!type) return;

    // REVENUE ACCOUNTS
    if (type === "Revenue") {
      revenue += Number(line.credit || 0) - Number(line.debit || 0);
    }

    // EXPENSE ACCOUNTS
    if (type === "Expense") {
      expenses += Number(line.debit || 0) - Number(line.credit || 0);
    }
  });


  const profit = revenue - expenses;

  renderIncomeStatement(revenue, expenses, profit);
}


//////////////////////////////////////////////////////
// RENDER UI
//////////////////////////////////////////////////////

function renderIncomeStatement(revenue, expenses, profit) {

  document.getElementById("revenue").innerText =
    revenue.toFixed(2) + " RWF";

  document.getElementById("expenses").innerText =
    expenses.toFixed(2) + " RWF";

  document.getElementById("profit").innerText =
    profit.toFixed(2) + " RWF";


  if (profit >= 0) {
    console.log("✔ Profit: " + profit);
  } else {
    console.log("❌ Loss: " + profit);
  }
}


//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await sb.auth.signOut();
  window.location.href = "index.html";
});
