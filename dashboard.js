//////////////////////////////////////////////////////
// SUPABASE INIT
//////////////////////////////////////////////////////

const sb = window.supabase.createClient(
  "https://duznidzlfvadjcoxynjh.supabase.co",
  "sb_publishable_3UzY44NnUmIi795wKqr2Kg_G0LBpJp4"
);


//////////////////////////////////////////////////////
// INIT DASHBOARD
//////////////////////////////////////////////////////

init();

async function init(){

  //////////////////////////////////////////////////////
  // CHECK SESSION
  //////////////////////////////////////////////////////

  const { data: sessionData } = await sb.auth.getSession();

  if(!sessionData.session){

    window.location.href = "index.html";
    return;

  }


  //////////////////////////////////////////////////////
  // GET USER
  //////////////////////////////////////////////////////

  const user = sessionData.session.user;


  //////////////////////////////////////////////////////
// WELCOME USER
//////////////////////////////////////////////////////

document.getElementById("welcomeTitle").innerText =
  "Welcome, " + user.email;

  
  //////////////////////////////////////////////////////
  // GET COMPANY
  //////////////////////////////////////////////////////

  const { data: company, error } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .single();


  if(error){

    alert(error.message);
    return;

  }


  //////////////////////////////////////////////////////
  // FILL COMPANY CARD
  //////////////////////////////////////////////////////

  document.getElementById("company_name").innerText =
    company.company_name || "-";

  document.getElementById("tin").innerText =
    company.tin || "-";

  document.getElementById("phone").innerText =
    company.phone || "-";

  document.getElementById("email").innerText =
    company.email || "-";

  document.getElementById("currency").innerText =
    company.currency_code || "RWF";

}


//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

document.getElementById("logoutBtn")
.addEventListener("click", logout);

async function logout(){

  await sb.auth.signOut();

  window.location.href = "index.html";

}
