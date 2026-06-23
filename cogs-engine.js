const sb = window.sb;

//////////////////////////////////////////////////////
// COGS CALCULATION ENGINE
//////////////////////////////////////////////////////

async function processCOGS(itemId, quantity, reference, companyId) {

  //////////////////////////////////////////////////////
  // GET ITEM
  //////////////////////////////////////////////////////

  const { data: item } = await sb
    .from("inventory_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (!item) return;

  //////////////////////////////////////////////////////
  // CALCULATE COST
  //////////////////////////////////////////////////////

  const unitCost = Number(item.cost_price || 0);
  const totalCost = unitCost * quantity;

  //////////////////////////////////////////////////////
  // SAVE COGS ENTRY
  //////////////////////////////////////////////////////

  await sb.from("cogs_entries").insert([{
    company_id: companyId,
    item_id: itemId,
    quantity,
    unit_cost: unitCost,
    total_cost: totalCost,
    reference
  }]);

  console.log("COGS recorded:", totalCost);

  return totalCost;
}
