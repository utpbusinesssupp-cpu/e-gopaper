const sb = window.sb;

//////////////////////////////////////////////////////
// COGS ENGINE (HYBRID: STANDARD + FIFO READY)
//////////////////////////////////////////////////////

async function processCOGS(itemId, quantity, reference, companyId) {

  //////////////////////////////////////////////////////
  // 1. GET ITEM
  //////////////////////////////////////////////////////

  const { data: item, error } = await sb
    .from("inventory_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (error || !item) {
    console.log("Item not found");
    return 0;
  }

  //////////////////////////////////////////////////////
  // 2. STANDARD COST (YOUR CURRENT SYSTEM)
  //////////////////////////////////////////////////////

  const unitCost = Number(item.cost_price || 0);
  const totalCost = unitCost * quantity;

  //////////////////////////////////////////////////////
  // 3. SAVE BASIC COGS ENTRY (COMPATIBILITY LAYER)
  //////////////////////////////////////////////////////

  await sb.from("cogs_entries").insert([{
    company_id: companyId,
    item_id: itemId,
    quantity,
    unit_cost: unitCost,
    total_cost: totalCost,
    reference
  }]);

  //////////////////////////////////////////////////////
  // 4. UPDATE INVENTORY STOCK
  //////////////////////////////////////////////////////

  const newQty = Number(item.stock_qty || 0) - quantity;

  await sb
    .from("inventory_items")
    .update({
      stock_qty: newQty
    })
    .eq("id", itemId);

  //////////////////////////////////////////////////////
  // 5. FIFO HOOK (STEP C READY)
  //////////////////////////////////////////////////////

  await sb.from("inventory_movements").insert([{
    company_id: companyId,
    item_id: itemId,
    type: "OUT",
    quantity,
    unit_cost: unitCost,
    reference
  }]);

  console.log("COGS processed:", totalCost);

  return {
    quantity,
    unitCost,
    totalCost
  };
}
