//////////////////////////////////////////////////////
// SUPABASE
//////////////////////////////////////////////////////

const sb = window.supabase.createClient(
    "https://duznidzlfvadjcoxynjh.supabase.co",
    "sb_publishable_3UzY44NnUmIi795wKqr2Kg_G0LBpJp4"
);


//////////////////////////////////////////////////////
// INIT
//////////////////////////////////////////////////////

init();

async function init(){

    //////////////////////////////////////////////////////
    // CHECK SESSION
    //////////////////////////////////////////////////////

    const { data: sessionData } =
        await sb.auth.getSession();

    if(!sessionData.session){

        window.location.href="index.html";
        return;

    }


    //////////////////////////////////////////////////////
    // GET USER
    //////////////////////////////////////////////////////

    const user =
        sessionData.session.user;


    //////////////////////////////////////////////////////
    // GET COMPANY
    //////////////////////////////////////////////////////

    const { data: company } =
        await sb
        .from("companies")
        .select("*")
        .eq("user_id",user.id)
        .single();


    //////////////////////////////////////////////////////
    // LOAD ACCOUNTS
    //////////////////////////////////////////////////////

    loadAccounts(company.id);


}


//////////////////////////////////////////////////////
// LOAD ACCOUNTS
//////////////////////////////////////////////////////

async function loadAccounts(companyId){

    const { data } =
        await sb
        .from("chart_of_accounts")
        .select("*")
        .eq("company_id",companyId)
        .order("account_code");


    const account =
        document.getElementById("account");

    account.innerHTML="";


    data.forEach(acc=>{

        account.innerHTML += `

            <option value="${acc.id}">

                ${acc.account_code}
                -
                ${acc.account_name}

            </option>

        `;

    });

}


//////////////////////////////////////////////////////
// SAVE BUTTON
//////////////////////////////////////////////////////

document
.getElementById("saveBtn")
.addEventListener(
    "click",
    submitTransaction
);


//////////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////////

document
.getElementById("logoutBtn")
.addEventListener(
    "click",
    logout
);


async function logout(){

    await sb.auth.signOut();

    window.location.href="index.html";

}
