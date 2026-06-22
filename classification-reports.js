//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.sb;

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

  const { data: company } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();

  //////////////////////////////////////////////////////
  // GET CLASSIFICATIONS
  //////////////////////////////////////////////////////

  const { data: rows, error } = await sb
    .from("transaction_classification")
    .select("*")
    .eq("company_id", company.id);

  if (error) {
    alert(error.message);
    return;
  }

  //////////////////////////////////////////////////////
  // GROUP DATA
  //////////////////////////////////////////////////////

  let ebm = 0;
  let nonEbm = 0;
  let paye = 0;
  let withholding = 0;

  rows.forEach(r => {

    const type = r.classification_type;

    if (type === "EBM") ebm++;
    else if (type === "NON_EBM") nonEbm++;
    else if (type === "PAYE") paye++;
    else if (type === "WITHHOLDING_TAX") withholding++;
  });

  //////////////////////////////////////////////////////
  // RENDER REPORTS
  //////////////////////////////////////////////////////

  renderReports(ebm, nonEbm, paye, withholding);
}

//////////////////////////////////////////////////////
// RENDER UI
//////////////////////////////////////////////////////

function renderReports(ebm, nonEbm, paye, withholding) {

  document.getElementById("ebmCount").innerText = ebm;
  document.getElementById("nonEbmCount").innerText = nonEbm;
  document.getElementById("payeCount").innerText = paye;
  document.getElementById("withholdingCount").innerText = withholding;

  console.log("📊 Classification Reports Loaded");
}

//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await sb.auth.signOut();
  window.location.href = "index.html";
});
