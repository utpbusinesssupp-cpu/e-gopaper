async function loadBalanceSheet() {

  const { data } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(account_type)
    `);

  let assets = 0;
  let liabilities = 0;
  let equity = 0;

  data.forEach(l => {

    const type = l.chart_of_accounts.account_type;

    if (type === "Asset") {
      assets += Number(l.debit || 0);
    }

    if (type === "Liability") {
      liabilities += Number(l.credit || 0);
    }

    if (type === "Equity") {
      equity += Number(l.credit || 0);
    }
  });

  console.log({
    assets,
    liabilities,
    equity
  });
}

loadBalanceSheet();
