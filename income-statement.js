async function loadIncomeStatement() {

  const { data } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(account_type)
    `);

  let revenue = 0;
  let expenses = 0;

  data.forEach(l => {

    if (l.chart_of_accounts.account_type === "Revenue") {
      revenue += Number(l.credit || 0);
    }

    if (l.chart_of_accounts.account_type === "Expense") {
      expenses += Number(l.debit || 0);
    }

  });

  const profit = revenue - expenses;

  console.log({
    revenue,
    expenses,
    profit
  });
}

loadIncomeStatement();
