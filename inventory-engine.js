//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// GLOBAL STATE
//////////////////////////////////////////////////////

let companyId = null;

//////////////////////////////////////////////////////
// INIT
//////////////////////////////////////////////////////

init();

async function init() {

  const { data: session } = await sb.auth.getSession();

  if (!session?.session) {
    window.location.href = "index.html";
    return;
  }

  const user = session.session.user;

  const { data: company, error } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !company) {
    alert("Company not found");
    return;
  }

  companyId = company.id;

  await loadItems();
}

//////////////////////////////////////////////////////
// CREATE ITEM (SAFE VERSION)
//////////////////////////////////////////////////////

async function createItem() {

  const name = document.getElementById("name").value.trim();
  const sku = document.getElementById("sku").value.trim();
  const cost = Number(document.getElementById("cost").value || 0);
  const price = Number(document.getElementById("price").value || 0);

  if (!name || !sku) {
    alert("Name and SKU required");
    return;
  }

  const { error } = await sb.from("inventory_items").insert([{
    company_id: companyId,
    name,
    sku,
    cost_price: cost,
    selling_price: price,
    stock_qty: 0
  }]);

  if (error) {
    alert(error.message);
    return;
  }

  await loadItems();
}

//////////////////////////////////////////////////////
// LOAD ITEMS
//////////////////////////////////////////////////////

async function loadItems() {

  const { data, error } = await sb
    .from("inventory_items")
    .select("*")
    .eq("company_id", companyId);

  if (error) {
    console.log(error.message);
    return;
  }

  render(data || []);
  fillDropdown(data || []);
}

//////////////////////////////////////////////////////
// RENDER TABLE
//////////////////////////////////////////////////////

function render(items) {

  const tbody = document.getElementById("itemsTable");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (!items.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">No items found</td>
      </tr>
    `;
    return;
  }

  items.forEach(i => {

    tbody.innerHTML += `
      <tr>
        <td>${i.name}</td>
        <td>${i.sku}</td>
        <td>${Number(i.stock_qty || 0)}</td>
        <td>${Number(i.cost_price || 0)}</td>
        <td>${Number(i.selling_price || 0)}</td>
      </tr>
    `;
  });
}

//////////////////////////////////////////////////////
// DROPDOWN
//////////////////////////////////////////////////////

function fillDropdown(items) {

  const select = document.getElementById("itemSelect");

  if (!select) return;

  select.innerHTML = "";

  items.forEach(i => {
    select.innerHTML += `
      <option value="${i.id}">
        ${i.name}
      </option>
    `;
  });
}

//////////////////////////////////////////////////////
// STOCK MOVEMENT + COGS ENGINE
//////////////////////////////////////////////////////

async function postMovement() {

  const itemId = document.getElementById("itemSelect").value;
  const type = document.getElementById("type").value;
  const qty = Number(document.getElementById("qty").value || 0);
  const ref = document.getElementById("ref").value;

  if (!itemId || qty <= 0) {
    alert("Invalid movement data");
    return;
  }

  //////////////////////////////////////////////////////
  // SAVE MOVEMENT
  //////////////////////////////////////////////////////

  await sb.from("inventory_movements").insert([{
    company_id: companyId,
    item_id: itemId,
    type,
    quantity: qty,
    reference: ref
  }]);

  //////////////////////////////////////////////////////
  // GET ITEM
  //////////////////////////////////////////////////////

  const { data: item } = await sb
    .from("inventory_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (!item) return;

  let newQty = Number(item.stock_qty || 0);

  //////////////////////////////////////////////////////
  // STOCK OUT → COGS TRIGGER (STEP B)
  //////////////////////////////////////////////////////

  if (type === "OUT") {

    const unitCost = Number(item.cost_price || 0);

    const totalCost = unitCost * qty;

    // 🔥 COGS ENTRY (NO EXTRA FILE NEEDED YET)
    await sb.from("cogs_entries").insert([{
      company_id: companyId,
      item_id: itemId,
      quantity: qty,
      unit_cost: unitCost,
      total_cost: totalCost,
      reference: ref
    }]);

    newQty -= qty;
  }

  //////////////////////////////////////////////////////
  // STOCK IN
  //////////////////////////////////////////////////////

  if (type === "IN") {
    newQty += qty;
  }

  //////////////////////////////////////////////////////
  // UPDATE STOCK
  //////////////////////////////////////////////////////

  await sb
    .from("inventory_items")
    .update({ stock_qty: newQty })
    .eq("id", itemId);

  await loadItems();
}
