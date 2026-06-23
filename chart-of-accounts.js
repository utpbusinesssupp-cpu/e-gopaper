//////////////////////////////////////////////////////
// SUPABASE INIT (GLOBAL INSTANCE)
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// INIT SYSTEM
//////////////////////////////////////////////////////

init();

async function init() {

  //////////////////////////////////////////////////////
  // AUTH CHECK
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

  if (companyError || !company) {
    console.log(companyError?.message);
    alert("Company not found");
    return;
  }

  //////////////////////////////////////////////////////
  // SEED DEFAULT CHART OF ACCOUNTS
  //////////////////////////////////////////////////////

  await seedDefaultAccounts(company.id);

  //////////////////////////////////////////////////////
  // LOAD ACCOUNTS
  //////////////////////////////////////////////////////

  await loadAccounts(company.id);

  //////////////////////////////////////////////////////
  // SEARCH LISTENER
  //////////////////////////////////////////////////////

  const searchInput = document.getElementById("searchAccount");
  if (searchInput) {
    searchInput.addEventListener("input", filterAccounts);
  }

  //////////////////////////////////////////////////////
  // LOGOUT
  //////////////////////////////////////////////////////

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
}

//////////////////////////////////////////////////////
// SEED DEFAULT CHART OF ACCOUNTS (INVENTORY READY)
//////////////////////////////////////////////////////

async function seedDefaultAccounts(companyId) {

  const { count, error } = await sb
    .from("chart_of_accounts")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (error) {
    console.log(error.message);
    return;
  }

  if (count && count > 0) {
    console.log("COA already exists");
    return;
  }

  const defaultAccounts = [

    // =========================
    // FIXED ASSETS
    // =========================
    ["1001", "Land", "Asset"],
    ["1002", "Buildings", "Asset"],
    ["1003", "Motor Vehicles", "Asset"],
    ["1004", "Machinery", "Asset"],
    ["1007", "IT Equipment", "Asset"],
    ["1008", "Furniture & Fittings", "Asset"],
    ["1010", "Accumulated Depreciation", "Asset"],

    // =========================
    // CURRENT ASSETS
    // =========================
    ["1201", "Inventory (Control Account)", "Asset"], // 🔥 INVENTORY CORE
    ["1202", "Raw Materials Inventory", "Asset"],
    ["1203", "Work In Progress Inventory", "Asset"],
    ["1204", "Finished Goods Inventory", "Asset"],

    ["1210", "Trade Receivables", "Asset"],
    ["1211", "Prepayments", "Asset"],
    ["1212", "Other Receivables", "Asset"],
    ["1220", "Cash in Hand", "Asset"],
    ["1221", "Bank Account", "Asset"],
    ["1222", "Mobile Money", "Asset"],

    // =========================
    // LIABILITIES
    // =========================
    ["2001", "Trade Payables", "Liability"],
    ["2004", "Bank Overdraft", "Liability"],
    ["2007", "VAT Payable", "Liability"],
    ["2008", "PAYE Payable", "Liability"],
    ["2009", "RSSB Payable", "Liability"],
    ["2010", "Income Tax Payable", "Liability"],

    // =========================
    // EQUITY
    // =========================
    ["3001", "Share Capital", "Equity"],
    ["3007", "Retained Earnings", "Equity"],
    ["3008", "Current Year Profit", "Equity"],

    // =========================
    // REVENUE
    // =========================
    ["4001", "Sales Revenue", "Revenue"],
    ["4002", "Service Revenue", "Revenue"],

    // =========================
    // EXPENSES (COGS + OPERATIONS)
    // =========================
    ["5201", "Raw Material Purchases", "Expense"],
    ["5202", "Trading Goods Purchases", "Expense"],

    ["5301", "Direct Wages", "Expense"],
    ["5302", "Factory Rent", "Expense"],
    ["5303", "Factory Water", "Expense"],
    ["5304", "Factory Electricity", "Expense"],
    ["5305", "Factory Fuel", "Expense"],

    ["6001", "Travel Expense", "Expense"],
    ["6002", "Advertising Expense", "Expense"],
    ["6003", "Audit Expense", "Expense"],
    ["6004", "Legal Expense", "Expense"],
    ["6005", "Consultancy Expense", "Expense"],
    ["6009", "Rent Expense", "Expense"],
    ["6011", "Electricity Expense", "Expense"],
    ["6014", "Fuel Expense", "Expense"],
    ["6020", "Security Expense", "Expense"],

    ["8001", "Salaries Expense", "Expense"],
    ["8004", "RSSB Employer Contribution", "Expense"],

    ["9001", "Interest Expense", "Expense"],
    ["9002", "Bank Charges", "Expense"]

  ];

  const rows = defaultAccounts.map(acc => ({
    company_id: companyId,
    account_code: acc[0],
    account_name: acc[1],
    account_type: acc[2],
    is_control_account: false,
    is_active: true
  }));

  const { error: insertError } = await sb
    .from("chart_of_accounts")
    .insert(rows);

  if (insertError) {
    console.log("Seed error:", insertError.message);
  } else {
    console.log("COA seeded successfully ✔ (Inventory included)");
  }
}

//////////////////////////////////////////////////////
// LOAD ACCOUNTS
//////////////////////////////////////////////////////

async function loadAccounts(companyId) {

  const { data, error } = await sb
    .from("chart_of_accounts")
    .select("*")
    .eq("company_id", companyId)
    .order("account_code", { ascending: true });

  if (error) {
    console.log(error.message);
    return;
  }

  renderAccounts(data || []);
}

//////////////////////////////////////////////////////
// RENDER ACCOUNTS
//////////////////////////////////////////////////////

function renderAccounts(accounts) {

  const tbody = document.getElementById("accountsTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!accounts.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4">No accounts found</td>
      </tr>
    `;
    return;
  }

  document.getElementById("totalAccounts").innerText = accounts.length;

  accounts.forEach(acc => {

    const statusClass = acc.is_active ? "status-active" : "status-inactive";
    const statusText = acc.is_active ? "Active" : "Inactive";

    tbody.innerHTML += `
      <tr>
        <td>${acc.account_code}</td>
        <td>${acc.account_name}</td>
        <td>${acc.account_type}</td>
        <td><span class="${statusClass}">${statusText}</span></td>
      </tr>
    `;
  });
}

//////////////////////////////////////////////////////
// SEARCH FILTER
//////////////////////////////////////////////////////

function filterAccounts() {

  const keyword =
    document.getElementById("searchAccount").value.toLowerCase();

  document.querySelectorAll("#accountsTable tr").forEach(row => {
    row.style.display =
      row.innerText.toLowerCase().includes(keyword) ? "" : "none";
  });
}

//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

async function logout() {
  await sb.auth.signOut();
  window.location.href = "index.html";
}
