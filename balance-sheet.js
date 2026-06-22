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

  const { data: sessionData } =
    await sb.auth.getSession();

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


  await loadBalanceSheet(company.id);

}


//////////////////////////////////////////////////////
// LOAD BALANCE SHEET
//////////////////////////////////////////////////////

async function loadBalanceSheet(companyId) {

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


  let assets = 0;

  let liabilities = 0;

  let equity = 0;


  data.forEach(line => {

    const type =
      line.chart_of_accounts.account_type;


    ////////////////////////////////////////////////////
    // ASSETS
    ////////////////////////////////////////////////////

    if (type === "Asset") {

      assets +=
        Number(line.debit || 0)
        -
        Number(line.credit || 0);

    }


    ////////////////////////////////////////////////////
    // LIABILITIES
    ////////////////////////////////////////////////////

    if (type === "Liability") {

      liabilities +=
        Number(line.credit || 0)
        -
        Number(line.debit || 0);

    }


    ////////////////////////////////////////////////////
    // EQUITY
    ////////////////////////////////////////////////////

    if (type === "Equity") {

      equity +=
        Number(line.credit || 0)
        -
        Number(line.debit || 0);

    }

  });


  const totalLE =
    liabilities + equity;


  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  document.getElementById("assets")
    .innerText =
      assets.toLocaleString() + " RWF";


  document.getElementById("liabilities")
    .innerText =
      liabilities.toLocaleString() + " RWF";


  document.getElementById("equity")
    .innerText =
      equity.toLocaleString() + " RWF";


  document.getElementById("liabilitiesEquity")
    .innerText =
      totalLE.toLocaleString() + " RWF";


  //////////////////////////////////////////////////////
  // VALIDATION
  //////////////////////////////////////////////////////

  if (Math.abs(assets - totalLE) > 1) {

    alert(
      "⚠ Balance Sheet out of balance"
    );

  }

}
