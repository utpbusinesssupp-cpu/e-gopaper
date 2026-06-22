//////////////////////////////////////////////////////
// SUPABASE CLIENT (GLOBAL STANDARD)
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// LOAD JOURNAL ENTRIES (V1 FINAL)
//////////////////////////////////////////////////////

async function loadJournal(companyId) {

  //////////////////////////////////////////////////////
  // FETCH JOURNAL ENTRIES (MULTI-TENANT SAFE)
  //////////////////////////////////////////////////////

  const { data, error } = await sb
    .from("journal_entries")
    .select(`
      id,
      entry_date,
      description,
      reference,
      journal_lines(
        debit,
        credit,
        chart_of_accounts(account_name)
      )
    `)
    .eq("company_id", companyId)
    .order("entry_date", { ascending: false });

  if (error) {
    console.log("Journal Error:", error.message);
    return;
  }

  renderJournal(data || []);
}

//////////////////////////////////////////////////////
// RENDER JOURNAL (ERP-GRADE VIEW ENGINE)
//////////////////////////////////////////////////////

function renderJournal(entries) {

  const container = document.getElementById("journalView");

  if (!container) return;

  container.innerHTML = "";

  if (!entries.length) {
    container.innerHTML = `
      <div class="card">
        No journal entries found
      </div>
    `;
    return;
  }

  //////////////////////////////////////////////////////
  // RENDER EACH ENTRY
  //////////////////////////////////////////////////////

  container.innerHTML = entries.map(entry => {

    const lines = (entry.journal_lines || []).map(l => {

      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);

      return `
        <div class="journal-line">
          <span class="acc">
            ${l.chart_of_accounts?.account_name || "-"}
          </span>
          <span class="debit">D: ${debit.toLocaleString()}</span>
          <span class="credit">C: ${credit.toLocaleString()}</span>
        </div>
      `;
    }).join("");

    return `
      <div class="card journal-entry">

        <div class="journal-header">
          <div class="date">${entry.entry_date}</div>
          <div class="desc">${entry.description}</div>
          <div class="ref">${entry.reference || ""}</div>
        </div>

        <hr/>

        <div class="journal-lines">
          ${lines}
        </div>

      </div>
    `;
  }).join("");
}

//////////////////////////////////////////////////////
// AUTO BOOTSTRAP (SAFE ENTRY POINT)
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

  await loadJournal(company.id);

})();
