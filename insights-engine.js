function generateInsights({ revenue, expenses, cashflow }) {

  const insights = [];

  if (revenue > expenses) {
    insights.push("✅ Business is profitable and stable.");
  }

  if (expenses > revenue) {
    insights.push("⚠️ Expenses exceed revenue — cost control needed.");
  }

  if (cashflow < 0) {
    insights.push("🚨 Cashflow risk detected.");
  }

  if (revenue > 5000000) {
    insights.push("📈 High revenue detected — consider scaling operations.");
  }

  return insights;
}
