//////////////////////////////////////////////////////
// SUPABASE CLIENT (GLOBAL)
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// BALANCE SHEET ENGINE (V1 FINAL)
//////////////////////////////////////////////////////

async function loadBalanceSheet(companyId) {

  //////////////////////////////////////////////////////
  // FETCH JOURNAL LINES (SAFE + MULTI-TENANT)
  //////////////////////////////////////////////////////

  const { data, error } = await sb
    .from("journal_lines")
    .select(`
      debit,
      credit,
      chart_of_accounts(account_type)
    `)
    .eq("company_id", companyId);

  if (error) {
    console.log("Balance Sheet Error:", error.message);
    return;
  }

  //////////////////////////////////////////////////////
  // INITIAL VALUES
  //////////////////////////////////////////////////////

  let assets = 0;
  let liabilities = 0;
  let equity = 0;

  //////////////////////////////////////////////////////
  // CALCULATION ENGINE
  //////////////////////////////////////////////////////

  (data || []).forEach(l => {

    const type = l.chart_of_accounts?.account_type;

    if (!type) return;

    switch (type) {

      case "Asset":
        assets += Number(l.debit || 0);
        break;

      case "Liability":
        liabilities += Number(l.credit || 0);
        break;

      case "Equity":
        equity += Number(l.credit || 0);
        break;
    }
  });

  //////////////////////////////////////////////////////
  // FINAL RESULT
  //////////////////////////////////////////////////////

  const totalLiabilitiesEquity = liabilities + equity;
  const balanceCheck = assets - totalLiabilitiesEquity;

  //////////////////////////////////////////////////////
  // OUTPUT (FOR UI)
  //////////////////////////////////////////////////////

  console.log("📊 BALANCE SHEET");
  console.log({
    assets,
    liabilities,
    equity,
    totalLiabilitiesEquity,
    balanceCheck,
    status: balanceCheck === 0 ? "BALANCED ✔" : "NOT BALANCED ❌"
  });

  //////////////////////////////////////////////////////
  // OPTIONAL UI UPDATE (IF YOU HAVE ELEMENTS)
  //////////////////////////////////////////////////////

  if (document.getElementById("assets")) {
    document.getElementById("assets").innerText = assets.toLocaleString();
  }

  if (document.getElementById("liabilities")) {
    document.getElementById("liabilities").innerText = liabilities.toLocaleString();
  }

  if (document.getElementById("equity")) {
    document.getElementById("equity").innerText = equity.toLocaleString();
  }

  if (document.getElementById("balanceStatus")) {
    document.getElementById("balanceStatus").innerText =
      balanceCheck === 0 ? "BALANCED ✔" : "NOT BALANCED ❌";
  }
}

//////////////////////////////////////////////////////
// AUTO RUN (SAFE)
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

  await loadBalanceSheet(company.id);

})();
