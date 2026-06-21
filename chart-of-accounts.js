//////////////////////////////////////////////////////
// SEED DEFAULT ACCOUNTS
//////////////////////////////////////////////////////

async function seedDefaultAccounts(companyId) {

  //////////////////////////////////////////////////////
  // CHECK IF ALREADY EXISTS
  //////////////////////////////////////////////////////

  const { data: existing, error: checkError } = await sb
    .from("chart_of_accounts")
    .select("id")
    .eq("company_id", companyId)
    .limit(1);

  if (checkError) {
    console.log(checkError.message);
    return;
  }

  if (existing && existing.length > 0) {

    console.log("Accounts already seeded");

    return;
  }


  //////////////////////////////////////////////////////
  // DEFAULT CHART OF ACCOUNTS
  //////////////////////////////////////////////////////

  const defaultAccounts = [

    // =========================
    // ASSETS
    // =========================

    {
      account_code: "1000",
      account_name: "Cash",
      account_type: "Asset"
    },

    {
      account_code: "1100",
      account_name: "Bank",
      account_type: "Asset"
    },

    {
      account_code: "1200",
      account_name: "Accounts Receivable",
      account_type: "Asset"
    },


    // =========================
    // LIABILITIES
    // =========================

    {
      account_code: "2000",
      account_name: "Accounts Payable",
      account_type: "Liability"
    },

    {
      account_code: "2100",
      account_name: "VAT Payable",
      account_type: "Liability"
    },

    {
      account_code: "2200",
      account_name: "PAYE Payable",
      account_type: "Liability"
    },

    {
      account_code: "2300",
      account_name: "RSSB Payable",
      account_type: "Liability"
    },

    {
      account_code: "2400",
      account_name: "Withholding Tax Payable",
      account_type: "Liability"
    },


    // =========================
    // EQUITY
    // =========================

    {
      account_code: "3000",
      account_name: "Owner Capital",
      account_type: "Equity"
    },

    {
      account_code: "3100",
      account_name: "Retained Earnings",
      account_type: "Equity"
    },


    // =========================
    // REVENUE
    // =========================

    {
      account_code: "4000",
      account_name: "Sales Revenue",
      account_type: "Revenue"
    },


    // =========================
    // EXPENSES
    // =========================

    {
      account_code: "5000",
      account_name: "Salary Expense",
      account_type: "Expense"
    },

    {
      account_code: "5100",
      account_name: "Rent Expense",
      account_type: "Expense"
    },

    {
      account_code: "5200",
      account_name: "Utilities Expense",
      account_type: "Expense"
    },

    {
      account_code: "5300",
      account_name: "Fuel Expense",
      account_type: "Expense"
    },

    {
      account_code: "5400",
      account_name: "Office Expense",
      account_type: "Expense"
    },

    {
      account_code: "5500",
      account_name: "Transport Expense",
      account_type: "Expense"
    },

    {
      account_code: "5600",
      account_name: "Repairs and Maintenance",
      account_type: "Expense"
    }

  ];


  //////////////////////////////////////////////////////
  // PREPARE INSERT
  //////////////////////////////////////////////////////

  const rows = defaultAccounts.map(acc => ({

    company_id: companyId,

    account_code: acc.account_code,

    account_name: acc.account_name,

    account_type: acc.account_type,

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

    console.log("Seed error:", error.message);

  }

  else {

    console.log("Default Chart of Accounts created ✔");

  }

}
