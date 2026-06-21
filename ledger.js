//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.supabase.createClient(
  "https://duznidzlfvadjcoxynjh.supabase.co",
  "sb_publishable_3UzY44NnUmIi795wKqr2Kg_G0LBpJp4"
);


//////////////////////////////////////////////////////
// INIT
//////////////////////////////////////////////////////

init();

async function init() {

  const { data: sessionData } = await sb.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  const user = sessionData.session.user;


  //////////////////////////////////////////////////////
  // GET COMPANY
  //////////////////////////////////////////////////////

  const { data: company, error: companyError } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (companyError) {
    alert(companyError.message);
    return;
  }


  //////////////////////////////////////////////////////
  // LOAD LEDGER DATA (JOIN LOGIC)
  //////////////////////////////////////////////////////

  const { data, error } = await sb
    .from("journal_lines")
    .select(`
      id,
      debit,
      credit,
      description,
      created_at,
      journal_entries (
        entry_date,
        description
      ),
      chart_of_accounts (
        account_name,
        account_code
      )
    `)
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (error) {
    alert(error.message);
    return;
  }

  renderLedger(data || []);
}


//////////////////////////////////////////////////////
// RENDER LEDGER TABLE
//////////////////////////////////////////////////////

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

  lines.forEach(line => {

    const date = line.journal_entries?.entry_date || "-";
    const desc = line.journal_entries?.description || "-";

    const account = line.chart_of_accounts?.account_name || "-";

    tbody.innerHTML += `
      <tr>

        <td>${date}</td>

        <td>${desc}</td>

        <td>${account}</td>

        <td>${line.debit || 0}</td>

        <td>${line.credit || 0}</td>

      </tr>
    `;
  });
}


//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

document.getElementById("logoutBtn").addEventListener("click", async () => {

  await sb.auth.signOut();
  window.location.href = "index.html";

});
