//////////////////////////////////////////////////////
// SUPABASE
//////////////////////////////////////////////////////

const sb = window.sb;


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


  await loadCashFlow(company.id);

}


//////////////////////////////////////////////////////
// LOAD CASH FLOW
//////////////////////////////////////////////////////

async function loadCashFlow(companyId) {

  const { data, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(
        account_code
      )
    `)
    .eq("company_id", companyId);

  if (error) {

    console.log(error.message);

    return;

  }


  let cashIn = 0;

  let cashOut = 0;


  data.forEach(line => {

    const code =
      line.chart_of_accounts.account_code;


    ////////////////////////////////////////////////////
    // CASH ACCOUNT
    ////////////////////////////////////////////////////

    if (code === "1000") {

      cashIn += Number(line.debit || 0);

      cashOut += Number(line.credit || 0);

    }

  });


  const netCashFlow =
    cashIn - cashOut;


  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  document.getElementById("cashIn")
    .innerText =
      cashIn.toLocaleString() + " RWF";

  document.getElementById("cashOut")
    .innerText =
      cashOut.toLocaleString() + " RWF";

  document.getElementById("netCashFlow")
    .innerText =
      netCashFlow.toLocaleString() + " RWF";

}
