//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.supabase.createClient(
  "https://duznidzlfvadjcoxynjh.supabase.co",
  "sb_publishable_3UzY44NnUmIi795wKqr2Kg_G0LBpJp4"
);

//////////////////////////////////////////////////////
// 🟣 1. FINANCIAL HEALTH SCORE
//////////////////////////////////////////////////////

function calculateFinancialHealth({ revenue, expenses, cashflow }) {

  let score = 50;

  if (revenue > expenses) score += 20;
  if (cashflow > 0) score += 20;
  if (expenses / revenue > 0.7) score -= 20;

  let level = "AVERAGE";

  if (score >= 80) level = "EXCELLENT";
  else if (score >= 60) level = "GOOD";
  else if (score < 40) level = "RISKY";

  return { score, level };
}

//////////////////////////////////////////////////////
// 🟣 2. EXPENSE ANOMALY DETECTION
//////////////////////////////////////////////////////

function detectExpenseAnomalies(transactions) {

  const anomalies = [];

  const avg = transactions.reduce((a, b) => a + b.amount, 0) / transactions.length;

  transactions.forEach(t => {

    if (t.amount > avg * 2) {
      anomalies.push({
        type: "HIGH_EXPENSE",
        message: `Unusual expense detected: ${t.amount}`
      });
    }
  });

  return anomalies;
}

//////////////////////////////////////////////////////
// 🟣 3. PROFIT FORECASTING (SIMPLE AI TREND)
//////////////////////////////////////////////////////

function forecastProfit(history) {

  if (!history.length) return 0;

  const growthRates = [];

  for (let i = 1; i < history.length; i++) {
    const growth = (history[i] - history[i - 1]) / history[i - 1];
    growthRates.push(growth);
  }

  const avgGrowth =
    growthRates.reduce((a, b) => a + b, 0) / growthRates.length;

  const next = history[history.length - 1] * (1 + avgGrowth);

  return next;
}

//////////////////////////////////////////////////////
// 🟣 4. CASHFLOW PREDICTION
//////////////////////////////////////////////////////

function predictCashflow(inflow, outflow) {

  const net = inflow - outflow;

  return {
    currentNet: net,
    trend: net > 0 ? "POSITIVE" : "NEGATIVE",
    warning: net < 0 ? "Cash risk detected" : null
  };
}

//////////////////////////////////////////////////////
// 🟣 5. SMART RECOMMENDATIONS ENGINE
//////////////////////////////////////////////////////

function generateRecommendations({ revenue, expenses, cashflow }) {

  const recs = [];

  if (expenses > revenue) {
    recs.push("Reduce operational expenses immediately");
  }

  if (cashflow < 0) {
    recs.push("Improve liquidity management");
  }

  if (revenue < 1000000) {
    recs.push("Focus on revenue growth strategies");
  }

  return recs;
}

//////////////////////////////////////////////////////
// 🟣 6. BUSINESS RISK SCORE
//////////////////////////////////////////////////////

function calculateBusinessRisk({ revenue, expenses, cashflow }) {

  let risk = 0;

  if (expenses > revenue) risk += 40;
  if (cashflow < 0) risk += 30;
  if (revenue < 500000) risk += 20;

  let level = "LOW";

  if (risk >= 70) level = "HIGH";
  else if (risk >= 40) level = "MEDIUM";

  return { risk, level };
}

//////////////////////////////////////////////////////
// 🟣 7. AI CFO MASTER REPORT
//////////////////////////////////////////////////////

async function generateAICFODashboard(companyId) {

  const { data: lines } = await sb
    .from("journal_lines")
    .select("debit, credit")
    .eq("company_id", companyId);

  let revenue = 0;
  let expenses = 0;

  lines.forEach(l => {
    revenue += Number(l.credit || 0);
    expenses += Number(l.debit || 0);
  });

  const cashflow = revenue - expenses;

  const health = calculateFinancialHealth({
    revenue,
    expenses,
    cashflow
  });

  const risk = calculateBusinessRisk({
    revenue,
    expenses,
    cashflow
  });

  const recommendations = generateRecommendations({
    revenue,
    expenses,
    cashflow
  });

  const prediction = predictProfitSimple(revenue, expenses);

  return {
    revenue,
    expenses,
    cashflow,
    health,
    risk,
    recommendations,
    prediction
  };
}

//////////////////////////////////////////////////////
// 🟣 8. SIMPLE PROFIT PREDICTION WRAPPER
//////////////////////////////////////////////////////

function predictProfitSimple(revenue, expenses) {

  const profit = revenue - expenses;

  const trend = profit > 0 ? "GROWING" : "DECLINING";

  return {
    currentProfit: profit,
    trend,
    nextEstimate: profit * 1.1
  };
}
