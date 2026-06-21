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
  // GET JOURNAL LINES WITH ACCOUNTS
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
  // CALCULATE BALANCE SHEET
  //////////////////////////////////////////////////////

  let assets = 0;
  let liabilities = 0;
  let equity = 0;

  lines.forEach(line => {

    const type = line.chart_of_accounts?.account_type;

    if (!type) return;

    //////////////////////////////////////////////////////
    // ASSETS
    //////////////////////////////////////////////////////
    if (type === "Asset") {
      assets += Number(line.debit || 0) - Number(line.credit || 0);
    }

    //////////////////////////////////////////////////////
    // LIABILITIES
    //////////////////////////////////////////////////////
    if (type === "Liability") {
      liabilities += Number(line.credit || 0) - Number(line.debit || 0);
    }

    //////////////////////////////////////////////////////
    // EQUITY
    //////////////////////////////////////////////////////
    if (type === "Equity") {
      equity += Number(line.credit || 0) - Number(line.debit || 0);
    }
  });


  //////////////////////////////////////////////////////
  // FINAL CHECK
  //////////////////////////////////////////////////////

  const balanceCheck = assets - (liabilities + equity);


  renderBalanceSheet(assets, liabilities, equity, balanceCheck);
}


//////////////////////////////////////////////////////
// RENDER UI
//////////////////////////////////////////////////////

function renderBalanceSheet(assets, liabilities, equity, balanceCheck) {

  document.getElementById("assets").innerText =
    assets.toFixed(2) + " RWF";

  document.getElementById("liabilities").innerText =
    liabilities.toFixed(2) + " RWF";

  document.getElementById("equity").innerText =
    equity.toFixed(2) + " RWF";

  document.getElementById("check").innerText =
    balanceCheck.toFixed(2);


  if (balanceCheck === 0) {
    console.log("✔ Balance Sheet is PERFECT");
  } else {
    console.log("❌ Balance Sheet NOT balanced");
  }
}


//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await sb.auth.signOut();
  window.location.href = "index.html";
});
