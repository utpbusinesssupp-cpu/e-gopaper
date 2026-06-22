//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.supabase.createClient(
  "https://duznidzlfvadjcoxynjh.supabase.co",
  "sb_publishable_3UzY44NnUmIi795wKqr2Kg_G0LBpJp4"
);

//////////////////////////////////////////////////////
// LOAD JOURNAL (FINAL)
//////////////////////////////////////////////////////

async function loadJournal() {

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
    .order("entry_date", { ascending: false });

  if (error) {
    console.log(error.message);
    return;
  }

  const container = document.getElementById("journalView");

  container.innerHTML = data.map(entry => {

    const lines = entry.journal_lines.map(l => `
      <div>
        ${l.chart_of_accounts?.account_name || "-"} 
        | D: ${l.debit} 
        | C: ${l.credit}
      </div>
    `).join("");

    return `
      <div class="card">
        <b>${entry.entry_date}</b><br/>
        ${entry.description}<br/>
        <small>${entry.reference || ""}</small>
        <hr/>
        ${lines}
      </div>
    `;
  }).join("");
}

loadJournal();
