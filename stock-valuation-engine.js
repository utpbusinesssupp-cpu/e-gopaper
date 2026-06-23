const sb = window.sb;

//////////////////////////////////////////////////////
// STOCK VALUATION ENGINE (AVERAGE COST METHOD)
//////////////////////////////////////////////////////

async function calculateStockValuation(companyId) {

  //////////////////////////////////////////////////////
  // GET ALL ITEMS
  //////////////////////////////////////////////////////

  const { data: items } = await sb
    .from("inventory_items")
    .select("*")
    .eq("company_id", companyId);

  if (!items) return;

  let totalInventoryValue = 0;

  //////////////////////////////////////////////////////
  // LOOP ITEMS
  //////////////////////////////////////////////////////

  for (const item of items) {

    const qty = Number(item.stock_qty || 0);
    const cost = Number(item.cost_price || 0);

    const value = qty * cost;

    totalInventoryValue += value;

    //////////////////////////////////////////////////////
    // SAVE SNAPSHOT PER ITEM
    //////////////////////////////////////////////////////

    await sb.from("inventory_valuation").insert([{
      company_id: companyId,
      item_id: item.id,
      quantity: qty,
      average_cost: cost,
      total_value: value
    }]);
  }

  console.log("TOTAL INVENTORY VALUE:", totalInventoryValue);

  return totalInventoryValue;
}
