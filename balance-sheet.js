const sb = window.sb;

//////////////////////////////////////////////////////
// BALANCE SHEET ENGINE (PRODUCTION ERP V1)
//////////////////////////////////////////////////////

async function loadBalanceSheet(companyId) {

  //////////////////////////////////////////////////////
  // FETCH JOURNAL LINES (CORE ACCOUNTING SOURCE)
  //////////////////////////////////////////////////////

  const { data: lines, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(account_type)
    `)
    .eq("company_id", companyId);

  if (error) {
    console.log("Balance Sheet Error:", error.message);
    return;
  }

  //////////////////////////////////////////////////////
  // FETCH INVENTORY VALUE (STEP C INTEGRATION)
  //////////////////////////////////////////////////////

  const { data: inventory } = await sb
    .from("inventory_items")
    .select("stock_qty, cost_price")
    .eq("company_id", companyId);

  let inventoryValue = 0;

  (inventory || []).forEach(i => {
    inventoryValue += Number(i.stock_qty || 0) * Number(i.cost_price || 0);
  });

  //////////////////////////////////////////////////////
  // INITIAL ACCOUNTS
  //////////////////////////////////////////////////////

  let assets = 0;
  let liabilities = 0;
  let equity = 0;

  //////////////////////////////////////////////////////
  // ACCOUNTING CLASSIFICATION LOOP
  //////////////////////////////////////////////////////

  (lines || []).forEach(l => {

    const type = l.chart_of_accounts?.account_type;

    const debit = Number(l.debit || 0);
    const credit = Number(l.credit || 0);

    if (!type) return;

    ////////////////////////////////////////////////////
    // ASSETS
    ////////////////////////////////////////////////////

    if (type === "Asset") {
      assets += debit;
      assets -= credit;
    }

    ////////////////////////////////////////////////////
    // LIABILITIES
    ////////////////////////////////////////////////////

    if (type === "Liability") {
      liabilities += credit;
      liabilities -= debit;
    }

    ////////////////////////////////////////////////////
    // EQUITY
    ////////////////////////////////////////////////////

    if (type === "Equity") {
      equity += credit;
      equity -= debit;
    }
  });

  //////////////////////////////////////////////////////
  // ADD INVENTORY AS CURRENT ASSET (CRITICAL ERP RULE)
  //////////////////////////////////////////////////////

  assets += inventoryValue;

  //////////////////////////////////////////////////////
  // FINAL EQUATION
  //////////////////////////////////////////////////////

  const totalLiabilitiesEquity = liabilities + equity;
  const balanceCheck = assets - totalLiabilitiesEquity;

  const status =
    balanceCheck === 0
      ? "BALANCED ✔"
      : "IMBALANCE DETECTED ❌";

  //////////////////////////////////////////////////////
  // UI OUTPUT
  //////////////////////////////////////////////////////

  set("assets", assets);
  set("liabilities", liabilities);
  set("equity", equity);

  set("liabilitiesEquity", totalLiabilitiesEquity);

  const statusEl = document.getElementById("balanceStatus");
  if (statusEl) statusEl.innerText = status;

  //////////////////////////////////////////////////////
  // DEBUG (ERP CONTROL PANEL)
  //////////////////////////////////////////////////////

  console.log("📊 BALANCE SHEET V1");
  console.log({
    assets,
    liabilities,
    equity,
    inventoryValue,
    totalLiabilitiesEquity,
    balanceCheck,
    status
  });
}

//////////////////////////////////////////////////////
// SAFE SETTER
//////////////////////////////////////////////////////

function set(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.innerText = Number(value || 0).toLocaleString() + " RWF";
  }
}

//////////////////////////////////////////////////////
// AUTO RUN
//////////////////////////////////////////////////////

(async () => {

  const { data: session } = await sb.auth.getSession();
  const user = session?.session?.user;

  if (!user) return;

  const { data: company } = await sb
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!company) return;

  await loadBalanceSheet(company.id);
})();
