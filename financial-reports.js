const sb = window.sb;

//////////////////////////////////////////////////////
// MASTER FINANCIAL REPORT ENGINE
//////////////////////////////////////////////////////

async function generateFinancialSnapshot(companyId) {

  const { data: lines } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(account_type)
    `)
    .eq("company_id", companyId);

  let revenue = 0;
  let expenses = 0;
  let assets = 0;
  let liabilities = 0;
  let equity = 0;

  lines.forEach(l => {

    const type = l.chart_of_accounts.account_type;

    const debit = Number(l.debit || 0);
    const credit = Number(l.credit || 0);

    if (type === "Revenue") revenue += credit;
    if (type === "Expense") expenses += debit;

    if (type === "Asset") assets += debit;
    if (type === "Liability") liabilities += credit;
    if (type === "Equity") equity += credit;
  });

  const profit = revenue - expenses;
  const cashflow = revenue - expenses;

  return {
    income_statement: { revenue, expenses, profit },
    balance_sheet: { assets, liabilities, equity },
    cashflow,
    health: (revenue > expenses) ? "GOOD" : "RISK"
  };
}
