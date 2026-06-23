const sb = window.sb;

//////////////////////////////////////////////////////
// GET STOCK LEVEL
//////////////////////////////////////////////////////

async function getStock(itemId) {

  const { data } = await sb
    .from("inventory_movements")
    .select("type, quantity")
    .eq("item_id", itemId);

  let stock = 0;

  data.forEach(m => {
    if (m.type === "IN") stock += m.quantity;
    if (m.type === "OUT") stock -= m.quantity;
  });

  return stock;
}
