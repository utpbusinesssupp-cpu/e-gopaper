const sb = window.sb;

async function loadDashboard(companyId) {

  const { data: journal } = await sb
    .from("journal_lines")
    .select("debit, credit, chart_of_accounts(account_type)")
    .eq("company_id", companyId);

  let revenue = 0;
  let expenses = 0;
  let cash = 0;

  journal.forEach(l => {

    const type = l.chart_of_accounts.account_type;

    if (type === "Revenue") revenue += Number(l.credit || 0);
    if (type === "Expense") expenses += Number(l.debit || 0);
    if (type === "Asset") cash += Number(l.debit || 0);
  });

  document.getElementById("revenue").innerText = revenue;
  document.getElementById("expenses").innerText = expenses;
  document.getElementById("cashBalance").innerText = cash;

  document.getElementById("netProfit").innerText = revenue - expenses;
}
