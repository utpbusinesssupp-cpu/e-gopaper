//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// 🟢 1. TRIAL BALANCE ENGINE
//////////////////////////////////////////////////////

async function generateTrialBalance(companyId) {

  const { data, error } = await sb
    .from("journal_lines")
    .select(`
      account_id,
      debit,
      credit,
      chart_of_accounts (
        account_code,
        account_name
      )
    `)
    .eq("company_id", companyId);

  if (error) throw new Error(error.message);

  const map = {};

  data.forEach(l => {

    const id = l.account_id;

    if (!map[id]) {
      map[id] = {
        account_code: l.chart_of_accounts.account_code,
        account_name: l.chart_of_accounts.account_name,
        debit: 0,
        credit: 0
      };
    }

    map[id].debit += Number(l.debit || 0);
    map[id].credit += Number(l.credit || 0);
  });

  return Object.values(map);
}

//////////////////////////////////////////////////////
// 🟢 2. INCOME STATEMENT ENGINE
//////////////////////////////////////////////////////

async function generateIncomeStatement(companyId) {

  const { data } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts (
        account_type
      )
    `)
    .eq("company_id", companyId);

  let revenue = 0;
  let expenses = 0;

  data.forEach(l => {

    const type = l.chart_of_accounts.account_type;

    if (type === "REVENUE") {
      revenue += Number(l.credit || 0);
    }

    if (type === "EXPENSE") {
      expenses += Number(l.debit || 0);
    }
  });

  return {
    revenue,
    expenses,
    profit: revenue - expenses
  };
}

//////////////////////////////////////////////////////
// 🟢 3. BALANCE SHEET ENGINE
//////////////////////////////////////////////////////

async function generateBalanceSheet(companyId) {

  const { data } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts (
        account_type
      )
    `)
    .eq("company_id", companyId);

  let assets = 0;
  let liabilities = 0;
  let equity = 0;

  data.forEach(l => {

    const type = l.chart_of_accounts.account_type;

    const balance = Number(l.debit || 0) - Number(l.credit || 0);

    if (type === "ASSET") assets += balance;
    if (type === "LIABILITY") liabilities += balance;
    if (type === "EQUITY") equity += balance;
  });

  return {
    assets,
    liabilities,
    equity,
    balanced: assets === (liabilities + equity)
  };
}

//////////////////////////////////////////////////////
// 🟢 4. CASH FLOW ENGINE
//////////////////////////////////////////////////////

async function generateCashFlow(companyId) {

  const { data } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      account_id
    `)
    .eq("company_id", companyId);

  let inflow = 0;
  let outflow = 0;

  data.forEach(l => {
    inflow += Number(l.debit || 0);
    outflow += Number(l.credit || 0);
  });

  return {
    inflow,
    outflow,
    netCash: inflow - outflow
  };
}

//////////////////////////////////////////////////////
// 🟢 5. GENERAL LEDGER (ACCOUNT VIEW)
//////////////////////////////////////////////////////

async function generateGeneralLedger(companyId) {

  const { data, error } = await sb
    .from("journal_lines")
    .select(`
      account_id,
      debit,
      credit,
      description,
      created_at,
      journal_entries (
        entry_date,
        reference
      ),
      chart_of_accounts (
        account_code,
        account_name
      )
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const ledger = {};

  data.forEach(l => {

    const id = l.account_id;

    if (!ledger[id]) {
      ledger[id] = {
        account_code: l.chart_of_accounts.account_code,
        account_name: l.chart_of_accounts.account_name,
        total_debit: 0,
        total_credit: 0,
        transactions: []
      };
    }

    ledger[id].transactions.push({
      date: l.journal_entries.entry_date,
      reference: l.journal_entries.reference,
      description: l.description,
      debit: l.debit,
      credit: l.credit
    });

    ledger[id].total_debit += Number(l.debit || 0);
    ledger[id].total_credit += Number(l.credit || 0);
  });

  return Object.values(ledger);
}

//////////////////////////////////////////////////////
// 🟢 6. GENERAL JOURNAL (CHRONOLOGICAL VIEW)
//////////////////////////////////////////////////////

async function generateGeneralJournal(companyId) {

  const { data, error } = await sb
    .from("journal_entries")
    .select(`
      entry_date,
      reference,
      description,
      journal_lines (
        debit,
        credit,
        chart_of_accounts (
          account_code,
          account_name
        )
      )
    `)
    .eq("company_id", companyId)
    .order("entry_date", { ascending: true });

  if (error) throw new Error(error.message);

  const journal = [];

  data.forEach(entry => {

    entry.journal_lines.forEach(line => {

      journal.push({
        date: entry.entry_date,
        reference: entry.reference,
        description: entry.description,
        account: line.chart_of_accounts.account_code,
        account_name: line.chart_of_accounts.account_name,
        debit: line.debit,
        credit: line.credit
      });

    });

  });

  return journal;
}

//////////////////////////////////////////////////////
// 🟢 7. MASTER REPORT LOADER (UI HOOK)
//////////////////////////////////////////////////////

async function loadAllFinancialReports(companyId) {

  const trialBalance = await generateTrialBalance(companyId);
  const income = await generateIncomeStatement(companyId);
  const balance = await generateBalanceSheet(companyId);
  const cashflow = await generateCashFlow(companyId);
  const ledger = await generateGeneralLedger(companyId);
  const journal = await generateGeneralJournal(companyId);

  console.log("TRIAL BALANCE", trialBalance);
  console.log("INCOME", income);
  console.log("BALANCE SHEET", balance);
  console.log("CASHFLOW", cashflow);
  console.log("LEDGER", ledger);
  console.log("JOURNAL", journal);

  return {
    trialBalance,
    income,
    balance,
    cashflow,
    ledger,
    journal
  };
}
