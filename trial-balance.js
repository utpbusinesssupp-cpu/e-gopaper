//////////////////////////////////////////////////////
// SUPABASE CLIENT (GLOBAL STANDARD)
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// TRIAL BALANCE ENGINE (V1 FINAL)
//////////////////////////////////////////////////////

async function loadTrialBalance(companyId) {

  //////////////////////////////////////////////////////
  // FETCH JOURNAL LINES (SAFE + MULTI-TENANT)
  //////////////////////////////////////////////////////

  const { data, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(account_code, account_name)
    `)
    .eq("company_id", companyId);

  if (error) {
    console.log("Trial Balance Error:", error.message);
    return;
  }

  //////////////////////////////////////////////////////
  // ACCOUNT AGGREGATION MAP
  //////////////////////////////////////////////////////

  const map = {};

  //////////////////////////////////////////////////////
  // BUILD LEDGER BALANCES
  //////////////////////////////////////////////////////

  (data || []).forEach(l => {

    const account = l.chart_of_accounts;

    if (!account) return;

    const key = `${account.account_code} - ${account.account_name}`;

    if (!map[key]) {
      map[key] = {
        account_code: account.account_code,
        account_name: account.account_name,
        debit: 0,
        credit: 0,
        balance: 0
      };
    }

    map[key].debit += Number(l.debit || 0);
    map[key].credit += Number(l.credit || 0);
  });

  //////////////////////////////////////////////////////
  // COMPUTE FINAL BALANCE
  //////////////////////////////////////////////////////

  Object.values(map).forEach(acc => {

    acc.balance = acc.debit - acc.credit;

  });

  //////////////////////////////////////////////////////
  // FINAL OUTPUT ARRAY
  //////////////////////////////////////////////////////

  const trialBalance = Object.values(map)
    .sort((a, b) => a.account_code.localeCompare(b.account_code));

  //////////////////////////////////////////////////////
  // VALIDATION CHECK (IMPORTANT ERP FEATURE)
  //////////////////////////////////////////////////////

  const totalDebit = trialBalance.reduce((sum, a) => sum + a.debit, 0);
  const totalCredit = trialBalance.reduce((sum, a) => sum + a.credit, 0);

  const isBalanced = totalDebit === totalCredit;

  //////////////////////////////////////////////////////
  // FINAL RESULT OBJECT
  //////////////////////////////////////////////////////

  const result = {
    trialBalance,
    totalDebit,
    totalCredit,
    isBalanced,
    status: isBalanced ? "BALANCED ✔" : "UNBALANCED ❌"
  };

  //////////////////////////////////////////////////////
  // LOG OUTPUT
  //////////////////////////////////////////////////////

  console.log("📊 TRIAL BALANCE REPORT");
  console.log(result);

  //////////////////////////////////////////////////////
  // OPTIONAL UI INTEGRATION
  //////////////////////////////////////////////////////

  const tbody = document.getElementById("trialBalanceTable");

  if (tbody) {

    tbody.innerHTML = trialBalance.map(acc => `
      <tr>
        <td>${acc.account_code}</td>
        <td>${acc.account_name}</td>
        <td>${acc.debit.toLocaleString()}</td>
        <td>${acc.credit.toLocaleString()}</td>
        <td>${acc.balance.toLocaleString()}</td>
      </tr>
    `).join("");
  }

  return result;
}

//////////////////////////////////////////////////////
// AUTO RUN ENTRY POINT
//////////////////////////////////////////////////////

(async () => {

  const { data: session } = await sb.auth.getSession();

  const user = session?.session?.user;
  if (!user) return;

  const { data: company } = await sb
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!company) return;

  await loadTrialBalance(company.id);

})();
