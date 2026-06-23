//////////////////////////////////////////////////////
// INVENTORY ENGINE V1 (PRODUCTION READY)
//////////////////////////////////////////////////////

const sb = window.sb;

let companyId = null;

//////////////////////////////////////////////////////
// INIT
//////////////////////////////////////////////////////

init();

async function init() {

  const { data: session } = await sb.auth.getSession();

  if (!session?.session?.user) {
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
// CREATE ITEM (WITH VALIDATION)
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
    .eq("company_id", companyId)
    .order("name", { ascending: true });

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

  if (items.length === 0) {
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
        <td>${i.stock_qty}</td>
        <td>${i.cost_price}</td>
        <td>${i.selling_price}</td>
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
// STOCK MOVEMENT ENGINE (CORE INVENTORY LOGIC)
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

  const { data: item, error } = await sb
    .from("inventory_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (error || !item) {
    alert("Item not found");
    return;
  }

  //////////////////////////////////////////////////////
  // INSERT MOVEMENT
  //////////////////////////////////////////////////////

  await sb.from("inventory_movements").insert([{
    company_id: companyId,
    item_id: itemId,
    type,
    quantity: qty,
    reference: ref
  }]);

  //////////////////////////////////////////////////////
  // UPDATE STOCK
  //////////////////////////////////////////////////////

  let newQty = item.stock_qty;

  if (type === "IN") {
    newQty = item.stock_qty + qty;
  }

  if (type === "OUT") {
    newQty = item.stock_qty - qty;
  }

  if (newQty < 0) newQty = 0;

  await sb
    .from("inventory_items")
    .update({ stock_qty: newQty })
    .eq("id", itemId);

  await loadItems();
}
