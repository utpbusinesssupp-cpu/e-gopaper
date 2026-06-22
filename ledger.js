const sb = window.sb;

async function loadLedger() {

  const { data, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      created_at,
      journal_entries(entry_date, description),
      chart_of_accounts(account_name)
    `)
    .order("created_at");

  if (error) {
    console.log(error.message);
    return;
  }

  renderLedger(data);
}

function renderLedger(lines) {

  const tbody = document.getElementById("ledgerTable");
  tbody.innerHTML = "";

  if (!lines.length) {
    tbody.innerHTML = `<tr><td colspan="5">No transactions</td></tr>`;
    return;
  }

  let grouped = {};

  lines.forEach(l => {

    const id = l.journal_entries?.entry_date + l.journal_entries?.description;

    if (!grouped[id]) {
      grouped[id] = {
        date: l.journal_entries?.entry_date,
        description: l.journal_entries?.description,
        lines: []
      };
    }

    grouped[id].lines.push(l);
  });

  Object.values(grouped).forEach(entry => {

    let totalDebit = 0;
    let totalCredit = 0;

    let html = "";

    entry.lines.forEach(l => {

      totalDebit += Number(l.debit || 0);
      totalCredit += Number(l.credit || 0);

      html += `
        <tr>
          <td></td>
          <td>${l.chart_of_accounts?.account_name || "-"}</td>
          <td>${l.debit}</td>
          <td>${l.credit}</td>
        </tr>
      `;
    });

    tbody.innerHTML += `
      <tr style="background:#e5e7eb;font-weight:bold">
        <td>${entry.date}</td>
        <td>${entry.description}</td>
        <td colspan="2"></td>
      </tr>
      ${html}
      <tr>
        <td></td>
        <td><b>TOTAL</b></td>
        <td><b>${totalDebit}</b></td>
        <td><b>${totalCredit}</b></td>
      </tr>
    `;
  });
}

loadLedger();
