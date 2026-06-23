//////////////////////////////////////////////////////
// STOCK VALUATION ENGINE (BALANCE SHEET CORE)
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// MAIN FUNCTION
//////////////////////////////////////////////////////

async function calculateInventoryValue(companyId) {

  //////////////////////////////////////////////////////
  // FETCH INVENTORY ITEMS
  //////////////////////////////////////////////////////

  const { data: items, error } = await sb
    .from("inventory_items")
    .select("*")
    .eq("company_id", companyId);

  if (error) {
    console.log("Inventory fetch error:", error.message);
    return 0;
  }

  //////////////////////////////////////////////////////
  // CALCULATE TOTAL VALUE
  //////////////////////////////////////////////////////

  let totalInventoryValue = 0;

  (items || []).forEach(item => {

    const qty = Number(item.stock_qty || 0);
    const cost = Number(item.cost_price || 0);

    totalInventoryValue += qty * cost;
  });

  //////////////////////////////////////////////////////
  // RETURN VALUE
  //////////////////////////////////////////////////////

  return totalInventoryValue;
}

//////////////////////////////////////////////////////
// BALANCE SHEET INTEGRATION HOOK
//////////////////////////////////////////////////////

async function updateInventoryInBalanceSheet(companyId) {

  const inventoryValue = await calculateInventoryValue(companyId);

  console.log("📦 Inventory Value:", inventoryValue);

  //////////////////////////////////////////////////////
  // OPTIONAL: STORE IN SUMMARY TABLE (IF EXISTS)
  //////////////////////////////////////////////////////

  const { error } = await sb
    .from("financial_snapshots")
    .upsert([{
      company_id: companyId,
      inventory_value: inventoryValue,
      updated_at: new Date()
    }], {
      onConflict: "company_id"
    });

  if (error) {
    console.log("Snapshot error:", error.message);
  }

  return inventoryValue;
}

//////////////////////////////////////////////////////
// AUTO REFRESH TRIGGER
//////////////////////////////////////////////////////

async function refreshStockValuation(companyId) {

  const value = await updateInventoryInBalanceSheet(companyId);

  return {
    success: true,
    inventory_value: value
  };
}
