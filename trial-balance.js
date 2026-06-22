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


  //////////////////////////////////////////////////////
  // COMPANY
  //////////////////////////////////////////////////////

  const { data: company } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();


  await loadTrialBalance(company.id);

}


//////////////////////////////////////////////////////
// LOAD TRIAL BALANCE
//////////////////////////////////////////////////////

async function loadTrialBalance(companyId) {

  const { data, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(
        account_code,
        account_name
      )
    `)
    .eq("company_id", companyId);


  if (error) {

    console.log(error.message);

    return;

  }


  //////////////////////////////////////////////////////
  // GROUP BY ACCOUNT
  //////////////////////////////////////////////////////

  let grouped = {};

  data.forEach(line => {

    const code =
      line.chart_of_accounts.account_code;

    if (!grouped[code]) {

      grouped[code] = {

        account_name:
          line.chart_of_accounts.account_name,

        debit: 0,

        credit: 0

      };

    }

    grouped[code].debit +=
      Number(line.debit || 0);

    grouped[code].credit +=
      Number(line.credit || 0);

  });


  renderTrialBalance(grouped);

}


//////////////////////////////////////////////////////
// RENDER
//////////////////////////////////////////////////////

function renderTrialBalance(grouped) {

  const tbody =
    document.getElementById("trialBalanceTable");

  tbody.innerHTML = "";


  let totalDebit = 0;

  let totalCredit = 0;


  Object.entries(grouped)

  .sort()

  .forEach(([code, acc]) => {

    totalDebit += acc.debit;

    totalCredit += acc.credit;


    tbody.innerHTML += `

    <tr>

      <td>${code}</td>

      <td>${acc.account_name}</td>

      <td>

        ${acc.debit.toLocaleString()}

      </td>

      <td>

        ${acc.credit.toLocaleString()}

      </td>

    </tr>

    `;

  });


  //////////////////////////////////////////////////////
  // TOTALS
  //////////////////////////////////////////////////////

  document.getElementById("totalDebit")
    .innerText =
      totalDebit.toLocaleString();

  document.getElementById("totalCredit")
    .innerText =
      totalCredit.toLocaleString();


  //////////////////////////////////////////////////////
  // VALIDATION
  //////////////////////////////////////////////////////

  if (totalDebit !== totalCredit) {

    alert(
      "⚠ Trial Balance out of balance!"
    );

  }

}
