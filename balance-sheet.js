//////////////////////////////////////////////////////
// SUPABASE CLIENT (GLOBAL)
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// BALANCE SHEET ENGINE (V2 - PRODUCTION READY)
//////////////////////////////////////////////////////

async function loadBalanceSheet(companyId) {

  //////////////////////////////////////////////////////
  // FETCH JOURNAL LINES
  //////////////////////////////////////////////////////

  const { data, error } = await sb
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
  // INITIAL VALUES
  //////////////////////////////////////////////////////

  let assets = 0;
  let liabilities = 0;
  let equity = 0;

  //////////////////////////////////////////////////////
  // INVENTORY (STEP C INTEGRATION HOOK)
  //////////////////////////////////////////////////////

  let inventoryValue = 0;

  try {
    if (window.calculateStockValuation) {
      inventoryValue = await window.calculateStockValuation(companyId);
    }
  } catch (e) {
    console.log("Inventory valuation error:", e.message);
    inventoryValue = 0;
  }

  //////////////////////////////////////////////////////
  // CORE CALCULATION ENGINE
  //////////////////////////////////////////////////////

  (data || []).forEach(l => {

    const type = l.chart_of_accounts?.account_type;

    if (!type) return;

    switch (type) {

      case "Asset":
        assets += Number(l.debit || 0);
        break;

      case "Liability":
        liabilities += Number(l.credit || 0);
        break;

      case "Equity":
        equity += Number(l.credit || 0);
        break;
    }
  });

  //////////////////////////////////////////////////////
  // ADD INVENTORY TO ASSETS (CRITICAL STEP C)
  //////////////////////////////////////////////////////

  assets += Number(inventoryValue || 0);

  //////////////////////////////////////////////////////
  // FINAL COMPUTATION
  //////////////////////////////////////////////////////

  const totalLiabilitiesEquity = liabilities + equity;
  const balanceCheck = assets - totalLiabilitiesEquity;

  //////////////////////////////////////////////////////
  // STATUS ENGINE
  //////////////////////////////////////////////////////

  let status = "BALANCED ✔";

  if (balanceCheck !== 0) {
    status = "NOT BALANCED ❌";
  }

  //////////////////////////////////////////////////////
  // OUTPUT LOGS (DEBUG + AUDIT)
  //////////////////////////////////////////////////////

  console.log("📊 BALANCE SHEET V2");
  console.log({
    assets,
    liabilities,
    equity,
    inventoryValue,
    totalLiabilitiesEquity,
    balanceCheck,
    status
  });

  //////////////////////////////////////////////////////
  // UI UPDATE (SAFE DOM CHECKS)
  //////////////////////////////////////////////////////

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value.toLocaleString();
  };

  set("assets", assets);
  set("liabilities", liabilities);
  set("equity", equity);

  const statusEl = document.getElementById("balanceStatus");
  if (statusEl) statusEl.innerText = status;

  //////////////////////////////////////////////////////
  // OPTIONAL EXTRA UI (IF EXISTS)
  //////////////////////////////////////////////////////

  const totalEl = document.getElementById("liabilitiesEquity");
  if (totalEl) {
    totalEl.innerText = totalLiabilitiesEquity.toLocaleString();
  }
}

//////////////////////////////////////////////////////
// AUTO RUN (PRO SAFE MULTI-TENANT)
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
