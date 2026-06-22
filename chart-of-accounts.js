//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.sb;

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

    alert("Company not found");

    return;

  }


  //////////////////////////////////////////////////////
  // AUTO SEED DEFAULT CHART OF ACCOUNTS
  //////////////////////////////////////////////////////

  await seedDefaultAccounts(company.id);


  //////////////////////////////////////////////////////
  // LOAD ACCOUNTS
  //////////////////////////////////////////////////////

  await loadAccounts(company.id);

}


//////////////////////////////////////////////////////
// LOAD ACCOUNTS
//////////////////////////////////////////////////////

async function loadAccounts(companyId) {

  const { data: accounts, error } = await sb
    .from("chart_of_accounts")
    .select("*")
    .eq("company_id", companyId)
    .order("account_code", {
      ascending: true
    });

  if (error) {

    console.log(error.message);

    return;

  }

  renderAccounts(accounts || []);

}

//////////////////////////////////////////////////////
// SEED DEFAULT CHART OF ACCOUNTS
//////////////////////////////////////////////////////

async function seedDefaultAccounts(companyId) {

  //////////////////////////////////////////////////////
  // CHECK IF ACCOUNTS ALREADY EXIST
  //////////////////////////////////////////////////////

  const { count, error: checkError } = await sb
    .from("chart_of_accounts")
    .select("*", {
      count: "exact",
      head: true
    })
    .eq("company_id", companyId);

  if (checkError) {

    console.log(checkError.message);

    return;

  }

  if (count && count > 0) {

    console.log("Chart of Accounts already exists");

    return;

  }


  //////////////////////////////////////////////////////
  // DEFAULT CHART OF ACCOUNTS
  //////////////////////////////////////////////////////

  const defaultAccounts = [

    ////////////////////////////////////////////////////
    // FIXED ASSETS
    ////////////////////////////////////////////////////

    ["1001", "Land", "Asset"],
    ["1002", "Buildings", "Asset"],
    ["1003", "Motor Vehicles", "Asset"],
    ["1004", "Machinery", "Asset"],
    ["1007", "IT Equipment", "Asset"],
    ["1008", "Furniture & Fittings", "Asset"],
    ["1010", "Accumulated Depreciation", "Asset"],

    ////////////////////////////////////////////////////
    // CURRENT ASSETS
    ////////////////////////////////////////////////////

    ["1201", "Inventory", "Asset"],
    ["1210", "Trade Receivables", "Asset"],
    ["1211", "Prepayments", "Asset"],
    ["1212", "Other Receivables", "Asset"],
    ["1220", "Cash in Hand", "Asset"],
    ["1221", "Bank Account", "Asset"],
    ["1222", "Mobile Money", "Asset"],

    ////////////////////////////////////////////////////
    // CURRENT LIABILITIES
    ////////////////////////////////////////////////////

    ["2001", "Trade Payables", "Liability"],
    ["2003", "Accrued Interest", "Liability"],
    ["2004", "Bank Overdraft", "Liability"],
    ["2007", "VAT Payable", "Liability"],
    ["2008", "PAYE Payable", "Liability"],
    ["2009", "RSSB Payable", "Liability"],
    ["2010", "Income Tax Payable", "Liability"],

    ////////////////////////////////////////////////////
    // LONG TERM LIABILITIES
    ////////////////////////////////////////////////////

    ["2101", "Foreign Loans Related Parties", "Liability"],
    ["2103", "Local Loans", "Liability"],
    ["2104", "Other Loans", "Liability"],

    ////////////////////////////////////////////////////
    // EQUITY
    ////////////////////////////////////////////////////

    ["3001", "Share Capital", "Equity"],
    ["3002", "Share Premium", "Equity"],
    ["3005", "General Reserve", "Equity"],
    ["3007", "Retained Earnings", "Equity"],
    ["3008", "Current Year Profit", "Equity"],

    ////////////////////////////////////////////////////
    // REVENUE
    ////////////////////////////////////////////////////

    ["4001", "Sales Revenue", "Revenue"],
    ["4002", "Service Revenue", "Revenue"],
    ["4003", "Rental Revenue", "Revenue"],
    ["4004", "Interest Income", "Revenue"],
    ["4005", "Dividend Income", "Revenue"],
    ["4006", "Exchange Gain", "Revenue"],
    ["4007", "Other Income", "Revenue"],

    ////////////////////////////////////////////////////
    // COST OF SALES
    ////////////////////////////////////////////////////

    ["5201", "Raw Material Purchases", "Expense"],
    ["5202", "Trading Goods Purchases", "Expense"],

    ["5301", "Direct Wages", "Expense"],
    ["5302", "Factory Rent", "Expense"],
    ["5303", "Factory Water", "Expense"],
    ["5304", "Factory Electricity", "Expense"],
    ["5305", "Factory Fuel", "Expense"],
    ["5307", "Consumables", "Expense"],
    ["5308", "Factory Depreciation", "Expense"],

    ////////////////////////////////////////////////////
    // OPERATING EXPENSES
    ////////////////////////////////////////////////////

    ["6001", "Travel Expense", "Expense"],
    ["6002", "Advertisement Expense", "Expense"],
    ["6003", "Audit Expense", "Expense"],
    ["6004", "Legal Expense", "Expense"],
    ["6005", "Consultancy Expense", "Expense"],
    ["6006", "Communication Expense", "Expense"],
    ["6008", "Donations", "Expense"],
    ["6009", "Rent Expense", "Expense"],
    ["6010", "Hotel Expense", "Expense"],
    ["6011", "Electricity Expense", "Expense"],
    ["6012", "Water Expense", "Expense"],
    ["6013", "Utilities Expense", "Expense"],
    ["6014", "Fuel Expense", "Expense"],
    ["6017", "Training Expense", "Expense"],
    ["6018", "Printing & Stationery", "Expense"],
    ["6019", "Cleaning Expense", "Expense"],
    ["6020", "Security Expense", "Expense"],
    ["6021", "Other Operating Expenses", "Expense"],

    ////////////////////////////////////////////////////
    // ADMINISTRATIVE EXPENSES
    ////////////////////////////////////////////////////

    ["7001", "Depreciation Expense", "Expense"],
    ["7003", "Management Fees", "Expense"],
    ["7004", "Research Expense", "Expense"],
    ["7005", "Decentralized Taxes", "Expense"],
    ["7007", "License Fees", "Expense"],
    ["7008", "Other Administrative Expenses", "Expense"],

    ////////////////////////////////////////////////////
    // EMPLOYMENT EXPENSES
    ////////////////////////////////////////////////////

    ["8001", "Salaries Expense", "Expense"],
    ["8002", "Bonus Expense", "Expense"],
    ["8003", "Medical Reimbursement", "Expense"],
    ["8004", "RSSB Employer Contribution", "Expense"],
    ["8005", "Other Fund Contribution", "Expense"],
    ["8006", "Life Insurance", "Expense"],
    ["8007", "Staff Welfare", "Expense"],
    ["8008", "Other Staff Costs", "Expense"],

    ////////////////////////////////////////////////////
    // FINANCIAL EXPENSES
    ////////////////////////////////////////////////////

    ["9001", "Interest Expense", "Expense"],
    ["9002", "Bank Charges", "Expense"],
    ["9003", "Insurance Expense", "Expense"],
    ["9004", "Commitment Fees", "Expense"],
    ["9005", "Exchange Loss", "Expense"],
    ["9006", "Other Financial Charges", "Expense"]

  ];


  //////////////////////////////////////////////////////
  // PREPARE INSERT
  //////////////////////////////////////////////////////

  const rows = defaultAccounts.map(acc => ({

    company_id: companyId,

    account_code: acc[0],

    account_name: acc[1],

    account_type: acc[2],

    is_control_account: false,

    is_active: true

  }));


  //////////////////////////////////////////////////////
  // INSERT
  //////////////////////////////////////////////////////

  const { error } = await sb
    .from("chart_of_accounts")
    .insert(rows);

  if (error) {

    console.log("Seed Error:", error.message);

  }

  else {

    console.log("Default Chart of Accounts created successfully ✔");

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
    .order("account_code", {
      ascending: true
    });

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

  //////////////////////////////////////////////////////
  // EMPTY STATE
  //////////////////////////////////////////////////////

  if (!accounts.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          No accounts found
        </td>
      </tr>
    `;

    return;

  }

  //////////////////////////////////////////////////////
  // ACCOUNT COUNT
  //////////////////////////////////////////////////////

  const totalAccounts = document.getElementById("totalAccounts");

  if (totalAccounts) {

    totalAccounts.innerText = accounts.length;

  }

  //////////////////////////////////////////////////////
  // RENDER ROWS
  //////////////////////////////////////////////////////

  accounts.forEach(acc => {

    const statusClass = acc.is_active
      ? "status-active"
      : "status-inactive";

    const statusText = acc.is_active
      ? "Active"
      : "Inactive";

    tbody.innerHTML += `

      <tr>

        <td>
          ${acc.account_code}
        </td>

        <td>
          ${acc.account_name}
        </td>

        <td>
          ${acc.account_type}
        </td>

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
// SEARCH ACCOUNTS
//////////////////////////////////////////////////////

function filterAccounts() {

  const searchInput =
    document.getElementById("searchAccount");

  if (!searchInput) return;

  const keyword =
    searchInput.value.toLowerCase();

  const rows =
    document.querySelectorAll("#accountsTable tr");

  rows.forEach(row => {

    const text =
      row.innerText.toLowerCase();

    row.style.display =
      text.includes(keyword)
      ? ""
      : "none";

  });

}

//////////////////////////////////////////////////////
// ADD ACCOUNT BUTTON
//////////////////////////////////////////////////////

const addAccountBtn =
  document.getElementById("addAccountBtn");

if (addAccountBtn) {

  addAccountBtn.addEventListener("click", () => {

    alert(
      "Add Account feature will be enabled in Version 1.1"
    );

  });

}

//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

const logoutBtn =
  document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    logout
  );

}

async function logout() {

  await sb.auth.signOut();

  window.location.href =
    "index.html";

}
