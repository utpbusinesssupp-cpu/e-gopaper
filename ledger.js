//////////////////////////////////////////////////////
// SUPABASE CLIENT (GLOBAL STANDARD)
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// LOAD GENERAL LEDGER (V1 FINAL)
//////////////////////////////////////////////////////

async function loadLedger(companyId) {

  //////////////////////////////////////////////////////
  // FETCH JOURNAL LINES (ERP SAFE + MULTI-TENANT)
  //////////////////////////////////////////////////////

  const { data, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      created_at,
      journal_entries(
        entry_date,
        description
      ),
      chart_of_accounts(
        account_name
      )
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) {
    console.log("Ledger Error:", error.message);
    return;
  }

  renderLedger(data || []);
}

//////////////////////////////////////////////////////
// RENDER LEDGER (ERP-GRADE GROUPING ENGINE)
//////////////////////////////////////////////////////

function renderLedger(lines) {

  const tbody = document.getElementById("ledgerTable");
  tbody.innerHTML = "";

  if (!lines.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">No transactions found</td>
      </tr>
    `;
    return;
  }

  //////////////////////////////////////////////////////
  // GROUP BY JOURNAL ENTRY (SAFE KEYING)
  //////////////////////////////////////////////////////

  const grouped = {};

  lines.forEach(l => {

    const entryDate = l.journal_entries?.entry_date || "";
    const desc = l.journal_entries?.description || "";

    const key = `${entryDate}-${desc}`;

    if (!grouped[key]) {
      grouped[key] = {
        date: entryDate,
        description: desc,
        lines: []
      };
    }

    grouped[key].lines.push(l);
  });

  //////////////////////////////////////////////////////
  // SORT GROUPS BY DATE (IMPORTANT FOR REPORTS)
  //////////////////////////////////////////////////////

  const sortedEntries = Object.values(grouped).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  //////////////////////////////////////////////////////
  // RENDER EACH JOURNAL ENTRY
  //////////////////////////////////////////////////////

  sortedEntries.forEach(entry => {

    let totalDebit = 0;
    let totalCredit = 0;

    let rows = "";

    entry.lines.forEach(l => {

      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);

      totalDebit += debit;
      totalCredit += credit;

      rows += `
        <tr style="background:#f9fafb">
          <td></td>
          <td>${l.chart_of_accounts?.account_name || "-"}</td>
          <td>${debit.toLocaleString()}</td>
          <td>${credit.toLocaleString()}</td>
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
        <td colspan="2"></td>
      </tr>

      ${rows}

      <tr style="border-bottom:2px solid #ddd">
        <td></td>
        <td><b>TOTAL</b></td>
        <td><b>${totalDebit.toLocaleString()}</b></td>
        <td><b>${totalCredit.toLocaleString()}</b></td>
      </tr>
    `;
  });
}

//////////////////////////////////////////////////////
// AUTO ENTRY POINT (SAFE BOOTSTRAP)
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

  await loadLedger(company.id);

})();
