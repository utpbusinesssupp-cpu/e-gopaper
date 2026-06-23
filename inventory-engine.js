const sb = window.sb;

let companyId = null;

init();

async function init() {

  const { data: session } = await sb.auth.getSession();

  if (!session.session) {
    window.location.href = "index.html";
    return;
  }

  const user = session.session.user;

  const { data: company } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();

  companyId = company.id;

  await loadItems();
}

//////////////////////////////////////////////////////
// CREATE ITEM
//////////////////////////////////////////////////////

async function createItem() {

  const name = document.getElementById("name").value;
  const sku = document.getElementById("sku").value;
  const cost = document.getElementById("cost").value;
  const price = document.getElementById("price").value;

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

  const { data } = await sb
    .from("inventory_items")
    .select("*")
    .eq("company_id", companyId);

  render(data || []);
  fillDropdown(data || []);
}

//////////////////////////////////////////////////////
// RENDER
//////////////////////////////////////////////////////

function render(items) {

  const tbody = document.getElementById("itemsTable");
  tbody.innerHTML = "";

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
// STOCK MOVEMENT
//////////////////////////////////////////////////////

async function postMovement() {

  const itemId = document.getElementById("itemSelect").value;
  const type = document.getElementById("type").value;
  const qty = Number(document.getElementById("qty").value);
  const ref = document.getElementById("ref").value;

  await sb.from("inventory_movements").insert([{
    company_id: companyId,
    item_id: itemId,
    type,
    quantity: qty,
    reference: ref
  }]);

  // UPDATE STOCK
  const { data: item } = await sb
    .from("inventory_items")
    .select("*")
    .eq("id", itemId)
    .single();

  let newQty =
    type === "IN"
      ? item.stock_qty + qty
      : item.stock_qty - qty;

  await sb
    .from("inventory_items")
    .update({ stock_qty: newQty })
    .eq("id", itemId);

  await loadItems();
}
