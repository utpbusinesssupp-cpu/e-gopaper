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

  const { data: sessionData } = await sb.auth.getSession();

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


  //////////////////////////////////////////////////////
  // LOAD ACCOUNT FILTER
  //////////////////////////////////////////////////////

  await loadAccounts(company.id);


  //////////////////////////////////////////////////////
  // LOAD LEDGER
  //////////////////////////////////////////////////////

  await loadLedger(company.id);


  //////////////////////////////////////////////////////
  // BUTTON
  //////////////////////////////////////////////////////

  document
    .getElementById("loadLedgerBtn")
    .addEventListener("click", () => {
      loadLedger(company.id);
    });

}


//////////////////////////////////////////////////////
// LOAD ACCOUNT FILTER
//////////////////////////////////////////////////////

async function loadAccounts(companyId) {

  const { data } = await sb
    .from("chart_of_accounts")
    .select("*")
    .eq("company_id", companyId)
    .order("account_code");

  const select = document.getElementById("accountFilter");

  data.forEach(acc => {

    select.innerHTML += `
      <option value="${acc.id}">
        ${acc.account_code} - ${acc.account_name}
      </option>
    `;

  });

}


//////////////////////////////////////////////////////
// LOAD LEDGER
//////////////////////////////////////////////////////

async function loadLedger(companyId) {

  const accountId =
    document.getElementById("accountFilter").value;

  let query = sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      description,
      journal_entries(
        id,
        entry_date,
        reference
      ),
      chart_of_accounts(
        account_code,
        account_name
      )
    `)
    .eq("company_id", companyId);


  //////////////////////////////////////////////////////
  // ACCOUNT FILTER
  //////////////////////////////////////////////////////

  if (accountId) {
    query = query.eq("account_id", accountId);
  }


  const { data, error } = await query;

  if (error) {

    console.log(error.message);

    return;

  }


  //////////////////////////////////////////////////////
  // SORT BY DATE
  //////////////////////////////////////////////////////

  data.sort((a, b) =>
    new Date(a.journal_entries.entry_date)
    -
    new Date(b.journal_entries.entry_date)
  );


  renderLedger(data);

}


//////////////////////////////////////////////////////
// RENDER LEDGER
//////////////////////////////////////////////////////

function renderLedger(lines) {

  const tbody = document.getElementById("ledgerTable");

  tbody.innerHTML = "";

  if (!lines.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          No transactions found
        </td>
      </tr>
    `;

    return;

  }


  //////////////////////////////////////////////////////
  // RUNNING BALANCE
  //////////////////////////////////////////////////////

  let runningBalance = 0;


  lines.forEach(line => {

    runningBalance +=
      Number(line.debit || 0)
      -
      Number(line.credit || 0);


    tbody.innerHTML += `

      <tr>

        <td>
          ${line.journal_entries?.entry_date || "-"}
        </td>

        <td>
          ${line.journal_entries?.reference || "-"}
        </td>

        <td>
          ${line.description || "-"}
        </td>

        <td>
          ${line.chart_of_accounts?.account_name || "-"}
        </td>

        <td>
          ${Number(line.debit).toLocaleString()}
        </td>

        <td>
          ${Number(line.credit).toLocaleString()}
        </td>

        <td>
          <b>
          ${runningBalance.toLocaleString()}
          </b>
        </td>

      </tr>

    `;

  });

}


//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

document
  .getElementById("logoutBtn")
  .addEventListener("click", logout);

async function logout() {

  await sb.auth.signOut();

  window.location.href = "index.html";

}
