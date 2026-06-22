//////////////////////////////////////////////////////
// 🧠 AI CFO ENGINE — V1 FINAL CLEAN ARCHITECTURE
//////////////////////////////////////////////////////

const sb = window.sb; // IMPORTANT (V1 STANDARD)

//////////////////////////////////////////////////////
// 1. FINANCIAL HEALTH SCORE
//////////////////////////////////////////////////////

function calculateFinancialHealth({ revenue, expenses, cashflow }) {

  let score = 50;

  if (revenue > expenses) score += 20;
  if (cashflow > 0) score += 20;
  if (revenue > 0 && expenses / revenue < 0.7) score += 10;

  let level = "AVERAGE";

  if (score >= 80) level = "EXCELLENT";
  else if (score >= 60) level = "GOOD";
  else if (score < 40) level = "RISKY";

  return { score, level };
}

//////////////////////////////////////////////////////
// 2. RISK SCORE
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
// 3. RECOMMENDATIONS ENGINE
//////////////////////////////////////////////////////

function generateRecommendations({ revenue, expenses, cashflow }) {

  const recs = [];

  if (expenses > revenue) recs.push("Reduce operational expenses");
  if (cashflow < 0) recs.push("Improve cashflow management");
  if (revenue < 1000000) recs.push("Increase revenue streams");

  return recs;
}

//////////////////////////////////////////////////////
// 4. PROFIT FORECAST (TREND BASED)
//////////////////////////////////////////////////////

function predictProfitSimple(revenue, expenses) {

  const profit = revenue - expenses;

  return {
    currentProfit: profit,
    trend: profit > 0 ? "GROWING" : "DECLINING",
    nextEstimate: profit * 1.1
  };
}

//////////////////////////////////////////////////////
// 5. EXPENSE ANOMALY DETECTION
//////////////////////////////////////////////////////

function detectExpenseAnomalies(transactions) {

  if (!transactions || transactions.length === 0) return [];

  const avg =
    transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length;

  return transactions
    .filter(t => t.amount > avg * 2)
    .map(t => ({
      type: "HIGH_EXPENSE",
      message: `Unusual expense detected: ${t.amount}`
    }));
}

//////////////////////////////////////////////////////
// 6. MAIN CFO REPORT ENGINE (FINAL ENTRY POINT)
//////////////////////////////////////////////////////

async function generateAICFODashboard(companyId) {

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
    return null;
  }

  let revenue = 0;
  let expenses = 0;

  lines.forEach(l => {

    const type = l.chart_of_accounts?.account_type;

    if (type === "Revenue") {
      revenue += Number(l.credit || 0);
    }

    if (type === "Expense") {
      expenses += Number(l.debit || 0);
    }
  });

  const cashflow = revenue - expenses;

  return {
    revenue,
    expenses,
    cashflow,

    health: calculateFinancialHealth({ revenue, expenses, cashflow }),
    risk: calculateBusinessRisk({ revenue, expenses, cashflow }),
    recommendations: generateRecommendations({ revenue, expenses, cashflow }),
    prediction: predictProfitSimple(revenue, expenses)
  };
}
