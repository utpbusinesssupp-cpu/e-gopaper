const sb = window.sb;

//////////////////////////////////////////////////////
// MASTER FINANCIAL REPORT ENGINE (V1 CLEAN)
//////////////////////////////////////////////////////

async function generateFinancialSnapshot(companyId, from, to) {

  //////////////////////////////////////////////////////
  // QUERY (SAFE + MULTI-TENANT + DATE FILTER READY)
  //////////////////////////////////////////////////////

  let query = sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      created_at,
      chart_of_accounts(account_type)
    `)
    .eq("company_id", companyId);

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data: lines, error } = await query;

  if (error) {
    console.log("Financial Report Error:", error.message);
    return null;
  }

  //////////////////////////////////////////////////////
  // INITIAL VALUES
  //////////////////////////////////////////////////////

  let revenue = 0;
  let expenses = 0;
  let assets = 0;
  let liabilities = 0;
  let equity = 0;

  //////////////////////////////////////////////////////
  // CORE CALCULATION ENGINE
  //////////////////////////////////////////////////////

  (lines || []).forEach(l => {

    const type = l.chart_of_accounts?.account_type;

    const debit = Number(l.debit || 0);
    const credit = Number(l.credit || 0);

    if (!type) return;

    ////////////////////////////////////////////////////
    // INCOME STATEMENT
    ////////////////////////////////////////////////////

    if (type === "Revenue") revenue += credit;
    if (type === "Expense") expenses += debit;

    ////////////////////////////////////////////////////
    // BALANCE SHEET
    ////////////////////////////////////////////////////

    if (type === "Asset") assets += debit;
    if (type === "Liability") liabilities += credit;
    if (type === "Equity") equity += credit;
  });

  //////////////////////////////////////////////////////
  // DERIVED METRICS
  //////////////////////////////////////////////////////

  const profit = revenue - expenses;
  const cashflow = profit;

  const totalEquityLiability = liabilities + equity;

  const balanceCheck = assets - totalEquityLiability;

  //////////////////////////////////////////////////////
  // HEALTH ENGINE (IMPROVED)
  //////////////////////////////////////////////////////

  let health = "STABLE";

  if (profit < 0) health = "RISK";
  if (revenue > 0 && expenses / revenue > 0.8) health = "WARNING";
  if (balanceCheck !== 0) health = "DATA_IMBALANCE";

  //////////////////////////////////////////////////////
  // FINAL OUTPUT (ERP SNAPSHOT)
  //////////////////////////////////////////////////////

  return {
    income_statement: {
      revenue,
      expenses,
      profit
    },

    balance_sheet: {
      assets,
      liabilities,
      equity,
      balance_check: balanceCheck
    },

    cashflow: {
      net: cashflow
    },

    health,

    meta: {
      generated_at: new Date().toISOString(),
      period: {
        from: from || null,
        to: to || null
      }
    }
  };
}
