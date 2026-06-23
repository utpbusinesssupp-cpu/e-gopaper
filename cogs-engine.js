//////////////////////////////////////////////////////
// COGS ENGINE V1 (PRODUCTION ERP CORE)
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// MAIN FUNCTION: PROCESS COGS
//////////////////////////////////////////////////////

async function processCOGS(itemId, quantity, reference, companyId) {

  if (!itemId || !quantity || quantity <= 0) {
    console.log("Invalid COGS input");
    return 0;
  }

  //////////////////////////////////////////////////////
  // FETCH ITEM
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
  // CALCULATE COST
  //////////////////////////////////////////////////////

  const unitCost = Number(item.cost_price || 0);
  const totalCost = unitCost * quantity;

  //////////////////////////////////////////////////////
  // SAVE COGS ENTRY
  //////////////////////////////////////////////////////

  const { error: insertError } = await sb
    .from("cogs_entries")
    .insert([{
      company_id: companyId,
      item_id: itemId,
      quantity: quantity,
      unit_cost: unitCost,
      total_cost: totalCost,
      reference: reference,
      created_at: new Date()
    }]);

  if (insertError) {
    console.log("COGS insert error:", insertError.message);
    return 0;
  }

  console.log("✔ COGS recorded:", totalCost);

  return totalCost;
}

//////////////////////////////////////////////////////
// AUTO COGS TRIGGER (OPTIONAL HOOK)
//////////////////////////////////////////////////////

async function autoCOGSFromSale(itemId, qty, reference, companyId) {

  const cost = await processCOGS(itemId, qty, reference, companyId);

  return {
    success: true,
    cogs: cost
  };
}
