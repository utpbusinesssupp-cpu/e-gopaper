//////////////////////////////////////////////////////
// SUPABASE
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// MODE STATE
//////////////////////////////////////////////////////

let mode = "login";

//////////////////////////////////////////////////////
// INIT
//////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", () => {
  checkSession();
});

//////////////////////////////////////////////////////
// CHECK SESSION (SAFE + PRODUCTION READY)
//////////////////////////////////////////////////////

async function checkSession() {
  try {
    const { data: { session }, error } = await sb.auth.getSession();

    if (error || !session?.user) return;

    const user = session.user;

    const { data: company, error: companyError } = await sb
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (companyError) {
      console.log(companyError.message);
      return;
    }

    if (!company) {
      window.location.href = "onboarding.html";
      return;
    }

    window.location.href = "dashboard.html";

  } catch (err) {
    console.log("Session error:", err.message);
  }
}

//////////////////////////////////////////////////////
// TOGGLE LOGIN / SIGNUP MODE
//////////////////////////////////////////////////////

function toggleMode() {

  mode = mode === "login" ? "signup" : "login";

  document.getElementById("title").innerText =
    mode === "login" ? "Login" : "Create Account";

  document.getElementById("submitBtn").innerText =
    mode === "login" ? "Login" : "Create Account";

  showMessage("");
}

//////////////////////////////////////////////////////
// MESSAGE HELPER
//////////////////////////////////////////////////////

function showMessage(message, success = false) {

  const msg = document.getElementById("msg");

  msg.innerText = message;

  msg.style.color = success ? "#16a34a" : "#dc2626";
}

//////////////////////////////////////////////////////
// AUTH HANDLER (LOGIN + SIGNUP)
//////////////////////////////////////////////////////

async function handleAuth() {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showMessage("Email and password are required");
    return;
  }

  //////////////////////////////////////////////////////
  // LOGIN
  //////////////////////////////////////////////////////

  if (mode === "login") {

    try {

      const { data, error } = await sb.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showMessage(error.message);
        return;
      }

      showMessage("Login successful ✔", true);

      const user = data.user;

      const { data: company } = await sb
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setTimeout(() => {

        if (!company) {
          window.location.href = "onboarding.html";
        } else {
          window.location.href = "dashboard.html";
        }

      }, 400);

    } catch (err) {
      showMessage(err.message);
    }

    return;
  }

  //////////////////////////////////////////////////////
  // SIGNUP
  //////////////////////////////////////////////////////

  try {

    const { error } = await sb.auth.signUp({
      email,
      password
    });

    if (error) {
      showMessage(error.message);
      return;
    }

    showMessage("Check email to confirm account ✔", true);

  } catch (err) {
    showMessage(err.message);
  }
}

//////////////////////////////////////////////////////
// FORGOT PASSWORD (MULTI-DOMAIN SAFE FIX)
//////////////////////////////////////////////////////

async function forgotPassword() {

  const email = document.getElementById("email").value.trim();

  if (!email) {
    showMessage("Enter your email first");
    return;
  }

  try {

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password.html"
    });

    if (error) {
      showMessage(error.message);
      return;
    }

    showMessage("Password reset email sent ✔ Check inbox", true);

  } catch (err) {
    showMessage(err.message);
  }
}
