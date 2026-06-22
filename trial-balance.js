async function loadTrialBalance() {

  const { data } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(account_name)
    `);

  let map = {};

  data.forEach(l => {

    const acc = l.chart_of_accounts.account_name;

    if (!map[acc]) {
      map[acc] = { debit: 0, credit: 0 };
    }

    map[acc].debit += Number(l.debit || 0);
    map[acc].credit += Number(l.credit || 0);
  });

  console.log("TRIAL BALANCE:", map);
}

loadTrialBalance();
