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
    .eq("user_id", user.id)
    .single();

  if (companyError) {
    console.log(companyError.message);
    alert("Company not found or access denied");
    return;
  }


  //////////////////////////////////////////////////////
  // SEED DEFAULT CHART OF ACCOUNTS (IMPORTANT)
  //////////////////////////////////////////////////////

  await seedDefaultAccounts(company.id);


  //////////////////////////////////////////////////////
  // LOAD ACCOUNTS
  //////////////////////////////////////////////////////

  const { data: accounts, error } = await sb
    .from("chart_of_accounts")
    .select("*")
    .eq("company_id", company.id)
    .order("account_code", { ascending: true });

  if (error) {
    alert(error.message);
    return;
  }

  renderAccounts(accounts || []);
}


//////////////////////////////////////////////////////
// SEED DEFAULT ACCOUNTS
//////////////////////////////////////////////////////

async function seedDefaultAccounts(companyId) {

  const defaultAccounts = [

    // ASSETS
    { account_code: "1000", account_name: "Cash", account_type: "Asset" },
    { account_code: "1100", account_name: "Bank", account_type: "Asset" },
    { account_code: "1200", account_name: "Accounts Receivable", account_type: "Asset" },

    // LIABILITIES
    { account_code: "2000", account_name: "Accounts Payable", account_type: "Liability" },
    { account_code: "2100", account_name: "VAT Payable", account_type: "Liability" },
    { account_code: "2200", account_name: "PAYE Payable", account_type: "Liability" },
    { account_code: "2300", account_name: "RSSB Payable", account_type: "Liability" },
    { account_code: "2400", account_name: "Withholding Tax", account_type: "Liability" },

    // EQUITY
    { account_code: "3000", account_name: "Capital", account_type: "Equity" },
    { account_code: "3100", account_name: "Retained Earnings", account_type: "Equity" },

    // REVENUE
    { account_code: "4000", account_name: "Revenue", account_type: "Revenue" },

    // EXPENSES
    { account_code: "5000", account_name: "Salaries Expense", account_type: "Expense" },
    { account_code: "5100", account_name: "Office Expense", account_type: "Expense" },
    { account_code: "5200", account_name: "Fuel Expense", account_type: "Expense" },
    { account_code: "5300", account_name: "EBM Supported Expense", account_type: "Expense" },
    { account_code: "5400", account_name: "Non-EBM Expense", account_type: "Expense" }

  ];

  // CHECK IF ALREADY EXISTS
  const { data: existing } = await sb
    .from("chart_of_accounts")
    .select("id")
    .eq("company_id", companyId)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log("Accounts already seeded");
    return;
  }

  const toInsert = defaultAccounts.map(acc => ({
    ...acc,
    company_id: companyId,
    is_active: true
  }));

  const { error } = await sb
    .from("chart_of_accounts")
    .insert(toInsert);

  if (error) {
    console.log("Seed error:", error.message);
  } else {
    console.log("Chart of Accounts seeded successfully ✔");
  }
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
