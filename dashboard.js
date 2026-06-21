//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.supabase.createClient(
  "https://duznidzlfvadjcoxynjh.supabase.co",
  "sb_publishable_3UzY44NnUmIi795wKqr2Kg_G0LBpJp4"
);

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

  document.getElementById("welcomeTitle").innerText =
    "Welcome, " + user.email;

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
  // POPULATE COMPANY INFO
  //////////////////////////////////////////////////////

  document.getElementById("company_name").innerText =
    company.company_name || "-";

  document.getElementById("tin").innerText =
    company.tin || "-";

  document.getElementById("phone").innerText =
    company.phone || "-";

  document.getElementById("email").innerText =
    company.email || "-";

  document.getElementById("currency").innerText =
    company.currency_code || "RWF";

  //////////////////////////////////////////////////////
  // LOAD DASHBOARD DATA (PHASE 6 READY HOOKS)
  //////////////////////////////////////////////////////

  await loadDashboardMetrics(company.id);
  await loadRecentActivities(company.id);
  await loadAIInsights(company.id);
}

//////////////////////////////////////////////////////
// 🟢 METRICS ENGINE (CASH / REVENUE / EXPENSES)
//////////////////////////////////////////////////////

async function loadDashboardMetrics(companyId) {

  const { data: lines, error } = await sb
    .from("journal_lines")
    .select("debit, credit, created_at, chart_of_accounts(account_type)")
    .eq("company_id", companyId);

  if (error) {
    console.log(error.message);
    return;
  }

  let cash = 0;
  let revenue = 0;
  let expenses = 0;

  lines.forEach(l => {

    const type = l.chart_of_accounts?.account_type;

    cash += (l.debit - l.credit);

    if (type === "REVENUE") {
      revenue += l.credit;
    }

    if (type === "EXPENSE") {
      expenses += l.debit;
    }
  });

  const net = revenue - expenses;

  document.getElementById("cashBalance").innerText =
    cash.toLocaleString() + " RWF";

  document.getElementById("revenue").innerText =
    revenue.toLocaleString() + " RWF";

  document.getElementById("expenses").innerText =
    expenses.toLocaleString() + " RWF";

  document.getElementById("netProfit").innerText =
    net.toLocaleString() + " RWF";
}

//////////////////////////////////////////////////////
// 🟢 RECENT ACTIVITIES
//////////////////////////////////////////////////////

async function loadRecentActivities(companyId) {

  const { data, error } = await sb
    .from("journal_entries")
    .select("description, entry_date, reference")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.log(error.message);
    return;
  }

  const container = document.getElementById("recentActivities");

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
// 🧠 AI INSIGHTS ENGINE (PHASE 6 READY)
//////////////////////////////////////////////////////

async function loadAIInsights(companyId) {

  const { data: expenses } = await sb
    .from("transaction_classification")
    .select("classification_type, description, created_at")
    .eq("company_id", companyId);

  const container = document.getElementById("insights");

  if (!expenses || expenses.length === 0) {
    container.innerHTML = "No insights available yet.";
    return;
  }

  let insights = [];

  const salaryCount = expenses.filter(e => e.classification_type === "PAYE").length;
  const ebmCount = expenses.filter(e => e.classification_type === "EBM").length;
  const taxCount = expenses.filter(e => e.classification_type === "WITHHOLDING_TAX").length;

  if (salaryCount > 0) {
    insights.push("📊 PAYE detected in payroll transactions.");
  }

  if (ebmCount > 5) {
    insights.push("📈 High EBM activity detected — compliance strong.");
  }

  if (taxCount > 3) {
    insights.push("⚠️ Withholding tax transactions increasing.");
  }

  if (insights.length === 0) {
    insights.push("✔ System stable — no anomalies detected.");
  }

  container.innerHTML = insights.map(i => `
    <div class="insight-item">${i}</div>
  `).join("");
}

//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

document.getElementById("logoutBtn")
  .addEventListener("click", logout);

async function logout() {
  await sb.auth.signOut();
  window.location.href = "index.html";
}
