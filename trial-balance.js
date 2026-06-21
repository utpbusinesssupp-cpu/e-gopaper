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
  // GET ALL ACCOUNTS
  //////////////////////////////////////////////////////

  const { data: accounts } = await sb
    .from("chart_of_accounts")
    .select("*")
    .eq("company_id", company.id);


  //////////////////////////////////////////////////////
  // GET ALL JOURNAL LINES
  //////////////////////////////////////////////////////

  const { data: lines, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts (
        id,
        account_name,
        account_code
      )
    `)
    .eq("company_id", company.id);

  if (error) {
    alert(error.message);
    return;
  }


  //////////////////////////////////////////////////////
  // BUILD TRIAL BALANCE
  //////////////////////////////////////////////////////

  const report = {};

  lines.forEach(line => {

    const acc = line.chart_of_accounts;

    if (!acc) return;

    const key = acc.id;

    if (!report[key]) {
      report[key] = {
        account_code: acc.account_code,
        account_name: acc.account_name,
        debit: 0,
        credit: 0
      };
    }

    report[key].debit += Number(line.debit || 0);
    report[key].credit += Number(line.credit || 0);
  });


  renderTrialBalance(Object.values(report));
}


//////////////////////////////////////////////////////
// RENDER TABLE
//////////////////////////////////////////////////////

function renderTrialBalance(data) {

  const tbody = document.getElementById("trialTable");

  tbody.innerHTML = "";

  let totalDebit = 0;
  let totalCredit = 0;

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4">No data found</td>
      </tr>
    `;
    return;
  }

  data.forEach(acc => {

    totalDebit += acc.debit;
    totalCredit += acc.credit;

    tbody.innerHTML += `
      <tr>
        <td>${acc.account_code}</td>
        <td>${acc.account_name}</td>
        <td>${acc.debit.toFixed(2)}</td>
        <td>${acc.credit.toFixed(2)}</td>
      </tr>
    `;
  });

  // FOOTER ROW
  tbody.innerHTML += `
    <tr style="font-weight:bold;background:#f3f4f6">
      <td colspan="2">TOTAL</td>
      <td>${totalDebit.toFixed(2)}</td>
      <td>${totalCredit.toFixed(2)}</td>
    </tr>
  `;

  if (totalDebit === totalCredit) {
    console.log("✔ Trial Balance OK");
  } else {
    console.log("❌ Trial Balance NOT BALANCED");
  }
}


//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await sb.auth.signOut();
  window.location.href = "index.html";
});
