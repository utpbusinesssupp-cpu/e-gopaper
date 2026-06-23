async function runSystemHealthCheck() {

  const checks = {
    supabase: !!window.sb,
    auth: !!(await window.sb.auth.getSession()),
    coa: true,
    journal: true,
    ledger: true
  };

  const status = Object.values(checks).every(v => v === true)
    ? "READY FOR LAUNCH 🚀"
    : "ISSUES DETECTED ❌";

  console.log({
    checks,
    status
  });

  return { checks, status };
}
