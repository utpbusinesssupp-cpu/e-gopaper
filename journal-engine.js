//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.supabase.createClient(
  "https://duznidzlfvadjcoxynjh.supabase.co",
  "sb_publishable_3UzY44NnUmIi795wKqr2Kg_G0LBpJp4"
);


//////////////////////////////////////////////////////
// CREATE JOURNAL ENTRY
//////////////////////////////////////////////////////

async function createJournalEntry({
  companyId,
  entryDate,
  description,
  reference,
  lines
}) {

  //////////////////////////////////////////////////////
  // VALIDATION (DOUBLE ENTRY RULE)
  //////////////////////////////////////////////////////

  let totalDebit = 0;
  let totalCredit = 0;

  lines.forEach(line => {
    totalDebit += Number(line.debit || 0);
    totalCredit += Number(line.credit || 0);
  });

  if (totalDebit !== totalCredit) {
    throw new Error(
      `Unbalanced Entry: Debit ${totalDebit} ≠ Credit ${totalCredit}`
    );
  }


  //////////////////////////////////////////////////////
  // INSERT JOURNAL ENTRY (HEADER)
  //////////////////////////////////////////////////////

  const { data: entry, error: entryError } = await sb
    .from("journal_entries")
    .insert([{
      company_id: companyId,
      entry_date: entryDate,
      description,
      reference,
      status: "POSTED"
    }])
    .select()
    .single();

  if (entryError) {
    throw new Error(entryError.message);
  }


  //////////////////////////////////////////////////////
  // INSERT JOURNAL LINES
  //////////////////////////////////////////////////////

  const formattedLines = lines.map(l => ({
    journal_entry_id: entry.id,
    company_id: companyId,
    account_id: l.account_id,
    debit: l.debit || 0,
    credit: l.credit || 0,
    description: l.description || null
  }));

  const { error: lineError } = await sb
    .from("journal_lines")
    .insert(formattedLines);

  if (lineError) {
    throw new Error(lineError.message);
  }

  return entry;
}
