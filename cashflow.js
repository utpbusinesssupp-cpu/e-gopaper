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
  // GET CASH ACCOUNT (1000)
  //////////////////////////////////////////////////////

  const { data: cashAccount } = await sb
    .from("chart_of_accounts")
    .select("id")
    .eq("company_id", company.id)
    .eq("account_code", "1000")
    .single();


  //////////////////////////////////////////////////////
  // GET CASH MOVEMENTS
  //////////////////////////////////////////////////////

  const { data: lines, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      account_id,
      chart_of_accounts (
        account_code,
        account_name
      )
    `)
    .eq("company_id", company.id);

  if (error) {
    alert(error.message);
    return;
  }


  //////////////////////////////////////////////////////
  // CASH FLOW CALCULATION
  //////////////////////////////////////////////////////

  let cashIn = 0;
  let cashOut = 0;

  lines.forEach(line => {

    const isCash = line.account_id === cashAccount.id;

    if (!isCash) return;

    // CASH INFLOW
    cashIn += Number(line.debit || 0);

    // CASH OUTFLOW
    cashOut += Number(line.credit || 0);
  });


  const netCashFlow = cashIn - cashOut;


  renderCashFlow(cashIn, cashOut, netCashFlow);
}


//////////////////////////////////////////////////////
// RENDER UI
//////////////////////////////////////////////////////

function renderCashFlow(inflow, outflow, net) {

  document.getElementById("cashIn").innerText =
    inflow.toFixed(2) + " RWF";

  document.getElementById("cashOut").innerText =
    outflow.toFixed(2) + " RWF";

  document.getElementById("netCash").innerText =
    net.toFixed(2) + " RWF";


  if (net >= 0) {
    console.log("✔ Positive Cash Flow");
  } else {
    console.log("❌ Negative Cash Flow");
  }
}


//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await sb.auth.signOut();
  window.location.href = "index.html";
});
