const sb = window.sb;

//////////////////////////////////////////////////////
// ADVANCED INVENTORY VALUATION (FIFO CORE)
//////////////////////////////////////////////////////

async function postMovementAdvanced({
  companyId,
  itemId,
  type,
  quantity,
  unitCost = 0,
  reference
}) {

  //////////////////////////////////////////////////////
  // 1. SAVE MOVEMENT
  //////////////////////////////////////////////////////

  await sb.from("inventory_movements").insert([{
    company_id: companyId,
    item_id: itemId,
    type,
    quantity,
    unit_cost: unitCost,
    reference
  }]);

  //////////////////////////////////////////////////////
  // 2. FIFO LOGIC (ADVANCED CORE)
  //////////////////////////////////////////////////////

  if (type === "IN") {

    await sb.from("inventory_valuation_layers").insert([{
      company_id: companyId,
      item_id: itemId,
      quantity_in: quantity,
      remaining_qty: quantity,
      unit_cost: unitCost
    }]);

  }

  if (type === "OUT") {

    let { data: layers } = await sb
      .from("inventory_valuation_layers")
      .select("*")
      .eq("item_id", itemId)
      .eq("company_id", companyId)
      .gt("remaining_qty", 0)
      .order("created_at", { ascending: true });

    let qtyToConsume = quantity;

    for (let layer of layers) {

      if (qtyToConsume <= 0) break;

      let consume = Math.min(layer.remaining_qty, qtyToConsume);

      await sb
        .from("inventory_valuation_layers")
        .update({
          remaining_qty: layer.remaining_qty - consume,
          quantity_out: layer.quantity_out + consume
        })
        .eq("id", layer.id);

      qtyToConsume -= consume;
    }
  }

  //////////////////////////////////////////////////////
  // 3. REFRESH STOCK MASTER
  //////////////////////////////////////////////////////

  const { data: layersSum } = await sb
    .from("inventory_valuation_layers")
    .select("remaining_qty, unit_cost")
    .eq("item_id", itemId);

  let stockQty = 0;
  let stockValue = 0;

  layersSum.forEach(l => {
    stockQty += Number(l.remaining_qty || 0);
    stockValue += Number(l.remaining_qty || 0) * Number(l.unit_cost || 0);
  });

  await sb
    .from("inventory_items")
    .update({
      stock_qty: stockQty,
      stock_value: stockValue
    })
    .eq("id", itemId);

  return {
    stockQty,
    stockValue
  };
}
