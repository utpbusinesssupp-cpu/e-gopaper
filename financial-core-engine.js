//////////////////////////////////////////////////////
// ERP FINANCIAL CORE ENGINE (FINAL SYSTEM)
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// MAIN SNAPSHOT ENGINE
//////////////////////////////////////////////////////

async function generateERPFinancialSnapshot(companyId) {

  //////////////////////////////////////////////////////
  // FETCH JOURNAL LINES
  //////////////////////////////////////////////////////

  const { data: lines, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(account_type)
    `)
    .eq("company_id", companyId);

  if (error) {
    console.log("Snapshot error:", error.message);
    return null;
  }

  //////////////////////////////////////////////////////
  // FETCH INVENTORY VALUE (ASSET EXTENSION)
  //////////////////////////////////////////////////////

  const { data: items } = await sb
    .from("inventory_items")
    .select("*")
    .eq("company_id", companyId);

  let inventoryValue = 0;

  (items || []).forEach(i => {
    inventoryValue += Number(i.stock_qty || 0) * Number(i.cost_price || 0);
  });

  //////////////////////////////////////////////////////
  // INITIAL VALUES
  //////////////////////////////////////////////////////

  let revenue = 0;
  let expenses = 0;
  let assets = 0;
  let liabilities = 0;
  let equity = 0;

  //////////////////////////////////////////////////////
  // PROCESS JOURNAL LINES
  //////////////////////////////////////////////////////

  (lines || []).forEach(l => {

    const type = l.chart_of_accounts?.account_type;

    const debit = Number(l.debit || 0);
    const credit = Number(l.credit || 0);

    if (!type) return;

    switch (type) {

      case "Revenue":
        revenue += credit;
        break;

      case "Expense":
        expenses += debit;
        break;

      case "Asset":
        assets += debit;
        break;

      case "Liability":
        liabilities += credit;
        break;

      case "Equity":
        equity += credit;
        break;
    }
  });

  //////////////////////////////////////////////////////
  // ADD INVENTORY INTO ASSETS
  //////////////////////////////////////////////////////

  assets += inventoryValue;

  //////////////////////////////////////////////////////
  // CALCULATIONS
  //////////////////////////////////////////////////////

  const profit = revenue - expenses;
  const netWorth = assets - liabilities;

  //////////////////////////////////////////////////////
  // FINAL ERP SNAPSHOT
  //////////////////////////////////////////////////////

  const snapshot = {
    income_statement: {
      revenue,
      expenses,
      cogs: 0, // ready for upgrade hook
      profit
    },

    balance_sheet: {
      assets,
      liabilities,
      equity,
      inventory: inventoryValue,
      net_worth: netWorth
    },

    health: {
      status: profit > 0 ? "PROFITABLE" : "LOSS",
      liquidity: assets > liabilities ? "GOOD" : "RISK"
    }
  };

  console.log("📊 ERP FINANCIAL SNAPSHOT:", snapshot);

  return snapshot;
}
