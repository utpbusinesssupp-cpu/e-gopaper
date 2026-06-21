function renderLedger(lines) {

  const tbody = document.getElementById("ledgerTable");
  tbody.innerHTML = "";

  if (!lines.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">No transactions yet</td>
      </tr>
    `;
    return;
  }


  //////////////////////////////////////////////////////
  // GROUP BY JOURNAL ENTRY
  //////////////////////////////////////////////////////

  const grouped = {};

  lines.forEach(line => {

    const entryId = line.journal_entries?.id || line.created_at;

    if (!grouped[entryId]) {
      grouped[entryId] = {
        date: line.journal_entries?.entry_date,
        description: line.journal_entries?.description,
        lines: []
      };
    }

    grouped[entryId].lines.push(line);
  });


  //////////////////////////////////////////////////////
  // RENDER GROUPED ENTRIES
  //////////////////////////////////////////////////////

  Object.values(grouped).forEach(entry => {

    let totalDebit = 0;
    let totalCredit = 0;

    let htmlLines = "";

    entry.lines.forEach(l => {

      totalDebit += Number(l.debit || 0);
      totalCredit += Number(l.credit || 0);

      htmlLines += `
        <tr style="background:#f9fafb">
          <td></td>
          <td>↳ ${l.chart_of_accounts?.account_name || "-"}</td>
          <td>${l.debit || 0}</td>
          <td>${l.credit || 0}</td>
        </tr>
      `;
    });


    //////////////////////////////////////////////////////
    // ENTRY HEADER ROW
    //////////////////////////////////////////////////////

    tbody.innerHTML += `
      <tr style="background:#e5e7eb;font-weight:bold">
        <td>${entry.date}</td>
        <td colspan="1">${entry.description}</td>
        <td colspan="2">Entry Total: ${totalDebit}</td>
      </tr>

      ${htmlLines}

      <tr style="border-bottom:2px solid #ddd">
        <td colspan="2"></td>
        <td><b>${totalDebit}</b></td>
        <td><b>${totalCredit}</b></td>
      </tr>
    `;
  });
}
