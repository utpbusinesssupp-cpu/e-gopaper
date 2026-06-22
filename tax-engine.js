//////////////////////////////////////////////////////
// SUPABASE CLIENT (GLOBAL STANDARD)
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// 🟣 1. EBM CLASSIFICATION ENGINE (CLEAN)
//////////////////////////////////////////////////////

function classifyEBM(description) {

  const desc = (description || "").toLowerCase();

  if (desc.includes("ebm") || desc.includes("invoice")) {
    return "EBM_SUPPORTED";
  }

  return "NON_EBM";
}

//////////////////////////////////////////////////////
// 🟣 2. PAYE ENGINE (Rwanda Progressive Tax)
//////////////////////////////////////////////////////

function calculatePAYE(amount) {

  let tax = 0;

  if (amount <= 300000) {
    tax = 0;
  }

  else if (amount <= 1000000) {
    tax = (amount - 300000) * 0.20;
  }

  else {
    tax = (700000 * 0.20) + (amount - 1000000) * 0.30;
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

  const rate = 0.15;

  const tax = amount * rate;

  return {
    base: amount,
    rate,
    tax,
    net: amount - tax
  };
}

//////////////////////////////////////////////////////
// 🟣 4. RSSB CONTRIBUTION ENGINE
//////////////////////////////////////////////////////

function calculateRSSB(salary) {

  const employeeRate = 0.05;
  const employerRate = 0.05;

  const employee = salary * employeeRate;
  const employer = salary * employerRate;

  return {
    employee,
    employer,
    total: employee + employer
  };
}

//////////////////////////////////////////////////////
// 🟣 5. TRANSACTION TAX CLASSIFIER (CORE ENGINE)
//////////////////////////////////////////////////////

function classifyTransactionTax(description, type, amount) {

  const ebm_status = classifyEBM(description);

  const result = {
    ebm_status,
    paye: null,
    withholding: null,
    rssb: null
  };

  //////////////////////////////////////////////////////
  // PAYE (ONLY SALARY)
  //////////////////////////////////////////////////////

  if (type === "salary") {
    result.paye = calculatePAYE(amount);
    result.rssb = calculateRSSB(amount);
  }

  //////////////////////////////////////////////////////
  // WITHHOLDING (SERVICE ONLY)
  //////////////////////////////////////////////////////

  if (type === "service") {
    result.withholding = calculateWithholding(amount);
  }

  return result;
}

//////////////////////////////////////////////////////
// 🟣 6. SAVE TAX RECORD (SAFE + MULTI-TENANT)
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
    console.log("Tax Save Error:", error.message);
  }
}

//////////////////////////////////////////////////////
// 🟣 7. TAX REPORT ENGINE (ERP READY)
//////////////////////////////////////////////////////

async function generateTaxReports(companyId) {

  const { data, error } = await sb
    .from("tax_classification")
    .select("*")
    .eq("company_id", companyId);

  if (error) {
    throw new Error(error.message);
  }

  let ebm_supported = 0;
  let non_ebm = 0;
  let total_paye_tax = 0;
  let total_withholding_tax = 0;
  let total_rssb = 0;

  (data || []).forEach(t => {

    if (t.ebm_status === "EBM_SUPPORTED") ebm_supported++;
    else non_ebm++;

    total_paye_tax += t.paye?.tax || 0;
    total_withholding_tax += t.withholding?.tax || 0;
    total_rssb += t.rssb?.total || 0;
  });

  return {
    ebm_supported,
    non_ebm,
    total_paye_tax,
    total_withholding_tax,
    total_rssb
  };
}

//////////////////////////////////////////////////////
// 🟣 8. MASTER TAX HOOK (INTEGRATION POINT)
//////////////////////////////////////////////////////

async function applyTaxEngine({
  companyId,
  journalEntryId,
  description,
  type,
  amount
}) {

  const taxData = classifyTransactionTax(
    description,
    type,
    amount
  );

  await saveTaxRecord({
    companyId,
    journalEntryId,
    taxData
  });

  console.log("🧾 TAX APPLIED:", taxData);

  return taxData;
}
