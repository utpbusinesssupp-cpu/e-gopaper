//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.supabase.createClient(
  "https://duznidzlfvadjcoxynjh.supabase.co",
  "sb_publishable_3UzY44NnUmIi795wKqr2Kg_G0LBpJp4"
);

//////////////////////////////////////////////////////
// INIT
//////////////////////////////////////////////////////

init();

async function init() {

  const { data: sessionData } = await sb.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  const user = sessionData.session.user;

  const { data: company } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();

  //////////////////////////////////////////////////////
  // GET CLASSIFICATIONS
  //////////////////////////////////////////////////////

  const { data: rows } = await sb
    .from("transaction_classification")
    .select("*")
    .eq("company_id", company.id);

  //////////////////////////////////////////////////////
  // BASIC METRICS
  //////////////////////////////////////////////////////

  let ebm = 0;
  let nonEbm = 0;
  let paye = 0;
  let withholding = 0;

  rows.forEach(r => {

    if (r.classification_type === "EBM") ebm++;
    else if (r.classification_type === "NON_EBM") nonEbm++;
    else if (r.classification_type === "PAYE") paye++;
    else if (r.classification_type === "WITHHOLDING_TAX") withholding++;
  });

  //////////////////////////////////////////////////////
  // ADVANCED INSIGHTS
  //////////////////////////////////////////////////////

  let insights = [];

  // 1. TAX RISK INSIGHT
  if (nonEbm > ebm) {
    insights.push("⚠ High NON-EBM expenses → VAT risk detected");
  }

  // 2. PAYE INSIGHT
  if (paye > 5) {
    insights.push("📊 High PAYE activity → payroll-heavy company");
  }

  // 3. WITHHOLDING INSIGHT
  if (withholding > 3) {
    insights.push("📌 Withholding tax transactions increasing");
  }

  // 4. BUSINESS HEALTH SIGNAL
  const total = ebm + nonEbm + paye + withholding;

  if (total > 0 && (nonEbm / total) > 0.6) {
    insights.push("🚨 Expense structure unhealthy (too many NON-EBM)");
  }

  if (insights.length === 0) {
    insights.push("✔ Business structure looks healthy");
  }

  renderInsights(insights);
}

//////////////////////////////////////////////////////
// RENDER INSIGHTS
//////////////////////////////////////////////////////

function renderInsights(insights) {

  const container = document.getElementById("insights");

  container.innerHTML = "";

  insights.forEach(i => {

    const div = document.createElement("div");

    div.style.padding = "10px";
    div.style.margin = "8px 0";
    div.style.background = "#fff";
    div.style.borderLeft = "5px solid #2563eb";
    div.style.borderRadius = "6px";

    div.innerText = i;

    container.appendChild(div);
  });
}
