const sb = window.sb;

//////////////////////////////////////////////////////
// MASTER DASHBOARD ENGINE (V2 - INVENTORY CONNECTED)
//////////////////////////////////////////////////////

async function loadDashboard(companyId) {

  //////////////////////////////////////////////////////
  // FETCH JOURNAL (FINANCIAL DATA)
  //////////////////////////////////////////////////////

  const { data: journal, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(account_type)
    `)
    .eq("company_id", companyId);

  if (error) {
    console.log("Dashboard error:", error.message);
    return;
  }

  //////////////////////////////////////////////////////
  // FINANCIAL VARIABLES
  //////////////////////////////////////////////////////

  let revenue = 0;
  let expenses = 0;
  let cash = 0;

  (journal || []).forEach(l => {

    const type = l.chart_of_accounts?.account_type;

    const debit = Number(l.debit || 0);
    const credit = Number(l.credit || 0);

    if (!type) return;

    if (type === "Revenue") revenue += credit;
    if (type === "Expense") expenses += debit;
    if (type === "Asset") cash += debit;
  });

  //////////////////////////////////////////////////////
  // INVENTORY INTEGRATION (STEP 2 CONNECT)
  //////////////////////////////////////////////////////

  const { data: inventory } = await sb
    .from("inventory_items")
    .select("stock_qty, cost_price")
    .eq("company_id", companyId);

  let inventoryQty = 0;
  let inventoryValue = 0;

  (inventory || []).forEach(i => {

    const qty = Number(i.stock_qty || 0);
    const cost = Number(i.cost_price || 0);

    inventoryQty += qty;
    inventoryValue += qty * cost;
  });

  //////////////////////////////////////////////////////
  // UI UPDATES (FINANCIAL)
  //////////////////////////////////////////////////////

  if (document.getElementById("revenue"))
    document.getElementById("revenue").innerText =
      revenue.toLocaleString();

  if (document.getElementById("expenses"))
    document.getElementById("expenses").innerText =
      expenses.toLocaleString();

  if (document.getElementById("cashBalance"))
    document.getElementById("cashBalance").innerText =
      cash.toLocaleString() + " RWF";

  if (document.getElementById("netProfit"))
    document.getElementById("netProfit").innerText =
      (revenue - expenses).toLocaleString();

  //////////////////////////////////////////////////////
  // UI UPDATES (INVENTORY LAYER)
  //////////////////////////////////////////////////////

  if (document.getElementById("inventoryItems"))
    document.getElementById("inventoryItems").innerText =
      inventoryQty;

  if (document.getElementById("inventoryValue"))
    document.getElementById("inventoryValue").innerText =
      inventoryValue.toLocaleString() + " RWF";

  //////////////////////////////////////////////////////
  // RETURN SNAPSHOT (FOR AI / CFO LAYER LATER)
  //////////////////////////////////////////////////////

  return {
    revenue,
    expenses,
    cash,
    netProfit: revenue - expenses,
    inventory: {
      quantity: inventoryQty,
      value: inventoryValue
    }
  };
}
