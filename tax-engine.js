//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// 🟣 1. EBM CLASSIFICATION ENGINE
//////////////////////////////////////////////////////

function classifyEBM(description) {

  const desc = (description || "").toLowerCase();

  if (desc.includes("ebm") || desc.includes("invoice")) {
    return "EBM_SUPPORTED";
  }

  return "NON_EBM";
}

//////////////////////////////////////////////////////
// 🟣 2. PAYE ENGINE (SALARY TAX)
//////////////////////////////////////////////////////

function calculatePAYE(amount) {

  let tax = 0;

  if (amount <= 300000) {
    tax = amount * 0.0;
  } 
  else if (amount <= 1000000) {
    tax = (amount - 300000) * 0.2;
  } 
  else {
    tax = (700000 * 0.2) + (amount - 1000000) * 0.3;
  }

  return {
    gross: amount,
    tax,
    net: amount - tax
  };
}

//////////////////////////////////////////////////////
// 🟣 3. WITHHOLDING TAX ENGINE
//////////////////////////////////////////////////////

function calculateWithholding(amount) {
  return {
    base: amount,
    rate: 0.15,
    tax: amount * 0.15,
    net: amount - (amount * 0.15)
  };
}

//////////////////////////////////////////////////////
// 🟣 4. RSSB CONTRIBUTION ENGINE
//////////////////////////////////////////////////////

function calculateRSSB(salary) {

  const employee = salary * 0.05;
  const employer = salary * 0.05;

  return {
    employee,
    employer,
    total: employee + employer
  };
}

//////////////////////////////////////////////////////
// 🟣 5. TRANSACTION TAX CLASSIFIER (CORE)
//////////////////////////////////////////////////////

function classifyTransactionTax(description, type, amount) {

  const ebm = classifyEBM(description);

  let result = {
    ebm_status: ebm,
    paye: null,
    withholding: null,
    rssb: null
  };

  //////////////////////////////////////////////////////
  // PAYE
  //////////////////////////////////////////////////////

  if (type === "salary") {
    result.paye = calculatePAYE(amount);
    result.rssb = calculateRSSB(amount);
  }

  //////////////////////////////////////////////////////
  // WITHHOLDING TAX
  //////////////////////////////////////////////////////

  if (type === "service") {
    result.withholding = calculateWithholding(amount);
  }

  return result;
}

//////////////////////////////////////////////////////
// 🟣 6. SAVE TAX RECORD
//////////////////////////////////////////////////////

async function saveTaxRecord({
  companyId,
  journalEntryId,
  taxData
}) {

  const { error } = await sb
    .from("tax_classification")
    .insert([{
      company_id: companyId,
      journal_entry_id: journalEntryId,
      ebm_status: taxData.ebm_status,
      paye: taxData.paye,
      withholding: taxData.withholding,
      rssb: taxData.rssb
    }]);

  if (error) {
    console.log("Tax save error:", error.message);
  }
}

//////////////////////////////////////////////////////
// 🟣 7. TAX REPORT ENGINE
//////////////////////////////////////////////////////

async function generateTaxReports(companyId) {

  const { data, error } = await sb
    .from("tax_classification")
    .select("*")
    .eq("company_id", companyId);

  if (error) throw new Error(error.message);

  let ebm = 0;
  let non_ebm = 0;
  let total_paye = 0;
  let total_withholding = 0;
  let total_rssb = 0;

  data.forEach(t => {

    if (t.ebm_status === "EBM_SUPPORTED") ebm++;
    else non_ebm++;

    if (t.paye) total_paye += t.paye.tax || 0;
    if (t.withholding) total_withholding += t.withholding.tax || 0;
    if (t.rssb) total_rssb += t.rssb.total || 0;
  });

  return {
    ebm_supported: ebm,
    non_ebm: non_ebm,
    total_paye_tax: total_paye,
    total_withholding_tax: total_withholding,
    total_rssb: total_rssb
  };
}

//////////////////////////////////////////////////////
// 🟣 8. MASTER TAX HOOK (TO JOURNAL ENGINE)
//////////////////////////////////////////////////////

async function applyTaxEngine({
  companyId,
  journalEntryId,
  description,
  type,
  amount
}) {

  const taxData = classifyTransactionTax(description, type, amount);

  await saveTaxRecord({
    companyId,
    journalEntryId,
    taxData
  });

  console.log("Tax Applied:", taxData);

  return taxData;
}
