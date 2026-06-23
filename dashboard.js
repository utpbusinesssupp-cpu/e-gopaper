//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// INIT DASHBOARD
//////////////////////////////////////////////////////

init();

async function init() {

  //////////////////////////////////////////////////////
  // SESSION CHECK
  //////////////////////////////////////////////////////

  const { data: sessionData } = await sb.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  const user = sessionData.session.user;

  //////////////////////////////////////////////////////
  // WELCOME USER
  //////////////////////////////////////////////////////

  const welcome = document.getElementById("welcomeTitle");
  if (welcome) {
    welcome.innerText = "Welcome, " + user.email;
  }

  //////////////////////////////////////////////////////
  // GET COMPANY
  //////////////////////////////////////////////////////

  const { data: company, error } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Company load error:", error.message);
    alert(error.message);
    return;
  }

  //////////////////////////////////////////////////////
  // COMPANY INFO
  //////////////////////////////////////////////////////

  setText("company_name", company.company_name);
  setText("tin", company.tin);
  setText("phone", company.phone);
  setText("email", company.email);
  setText("currency", company.currency_code || "RWF");

  //////////////////////////////////////////////////////
  // LOAD ALL MODULES
  //////////////////////////////////////////////////////

  await loadDashboardMetrics(company.id);
  await loadInventoryDashboard(company.id); // 🟢 STEP 2 CONNECT
  await loadRecentActivities(company.id);
  await loadAIInsights(company.id);
}

//////////////////////////////////////////////////////
// SAFE TEXT HELPER
//////////////////////////////////////////////////////

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value || "-";
}

//////////////////////////////////////////////////////
// 🟢 FINANCIAL METRICS ENGINE
//////////////////////////////////////////////////////

async function loadDashboardMetrics(companyId) {

  const { data: lines, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(account_type)
    `)
    .eq("company_id", companyId);

  if (error) {
    console.log(error.message);
    return;
  }

  let cash = 0;
  let revenue = 0;
  let expenses = 0;

  (lines || []).forEach(l => {

    const type = l.chart_of_accounts?.account_type;

    const debit = Number(l.debit || 0);
    const credit = Number(l.credit || 0);

    if (!type) return;

    // CASH (basic ERP approximation)
    cash += (debit - credit);

    // FIXED CASE CONSISTENCY
    if (type === "Revenue") revenue += credit;
    if (type === "Expense") expenses += debit;
  });

  const net = revenue - expenses;

  setText("cashBalance", cash.toLocaleString() + " RWF");
  setText("revenue", revenue.toLocaleString() + " RWF");
  setText("expenses", expenses.toLocaleString() + " RWF");
  setText("netProfit", net.toLocaleString() + " RWF");
}

//////////////////////////////////////////////////////
// 🟢 INVENTORY ENGINE (STEP 2 CONNECT)
//////////////////////////////////////////////////////

async function loadInventoryDashboard(companyId) {

  const { data, error } = await sb
    .from("inventory_items")
    .select("stock_qty, cost_price")
    .eq("company_id", companyId);

  if (error) {
    console.log(error.message);
    return;
  }

  let qty = 0;
  let value = 0;

  (data || []).forEach(i => {
    qty += Number(i.stock_qty || 0);
    value += Number(i.stock_qty || 0) * Number(i.cost_price || 0);
  });

  setText("inventoryItems", qty);
  setText("inventoryValue", value.toLocaleString() + " RWF");
}

//////////////////////////////////////////////////////
// 🟢 RECENT ACTIVITIES
//////////////////////////////////////////////////////

async function loadRecentActivities(companyId) {

  const { data, error } = await sb
    .from("journal_entries")
    .select("description, entry_date, reference")
    .eq("company_id", companyId)
    .order("entry_date", { ascending: false })
    .limit(5);

  if (error) {
    console.log(error.message);
    return;
  }

  const container = document.getElementById("recentActivities");
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = "No transactions yet.";
    return;
  }

  container.innerHTML = data.map(e => `
    <div class="insight-item">
      <b>${e.description}</b><br/>
      <small>${e.entry_date} | ${e.reference || "-"}</small>
    </div>
  `).join("");
}

//////////////////////////////////////////////////////
// 🧠 AI INSIGHTS ENGINE
//////////////////////////////////////////////////////

async function loadAIInsights(companyId) {

  const { data } = await sb
    .from("transaction_classification")
    .select("classification_type")
    .eq("company_id", companyId);

  const container = document.getElementById("insights");
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = "No insights available yet.";
    return;
  }

  let paye = 0;
  let ebm = 0;
  let wht = 0;

  data.forEach(r => {

    if (r.classification_type === "PAYE") paye++;
    if (r.classification_type === "EBM") ebm++;
    if (r.classification_type === "WITHHOLDING_TAX") wht++;
  });

  let insights = [];

  if (paye > 0) insights.push("📊 PAYE payroll detected.");
  if (ebm > 5) insights.push("📈 Strong EBM compliance activity.");
  if (wht > 3) insights.push("⚠️ Withholding tax activity increasing.");
  if (insights.length === 0) insights.push("✔ System stable — no anomalies.");

  container.innerHTML = insights.map(i =>
    `<div class="insight-item">${i}</div>`
  ).join("");
}

//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await sb.auth.signOut();
    window.location.href = "index.html";
  });
}
