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

  //////////////////////////////////////////////////////
  // SESSION CHECK
  //////////////////////////////////////////////////////

  const { data: sessionData } = await sb.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  const user = sessionData.session.user;


  //////////////////////////////////////////////////////
  // GET COMPANY
  //////////////////////////////////////////////////////

  const { data: company, error: companyError } = await sb
    .from("companies")
    .select("*")
    .eq("id", user.id)
    .single();

  // NOTE: if you store company_id differently adjust later


  if (companyError) {
    console.log(companyError.message);
  }


  //////////////////////////////////////////////////////
  // LOAD ACCOUNTS
  //////////////////////////////////////////////////////

  const { data: accounts, error } = await sb
    .from("chart_of_accounts")
    .select("*")
    .order("account_code", { ascending: true });


  if (error) {
    alert(error.message);
    return;
  }


  renderAccounts(accounts || []);
}


//////////////////////////////////////////////////////
// RENDER TABLE
//////////////////////////////////////////////////////

function renderAccounts(accounts) {

  const tbody = document.getElementById("accountsTable");

  tbody.innerHTML = "";

  if (accounts.length === 0) {

    tbody.innerHTML = `
      <tr>
        <td colspan="4">No accounts found.</td>
      </tr>
    `;

    return;
  }

  accounts.forEach(acc => {

    const statusClass = acc.is_active
      ? "status-active"
      : "status-inactive";

    const statusText = acc.is_active
      ? "Active"
      : "Inactive";

    tbody.innerHTML += `
      <tr>
        <td>${acc.account_code}</td>
        <td>${acc.account_name}</td>
        <td>${acc.account_type}</td>
        <td>
          <span class="${statusClass}">
            ${statusText}
          </span>
        </td>
      </tr>
    `;
  });
}


//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

document.getElementById("logoutBtn").addEventListener("click", logout);

async function logout() {
  await sb.auth.signOut();
  window.location.href = "index.html";
}
