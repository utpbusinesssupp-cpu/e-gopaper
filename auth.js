//////////////////////////////////////////////////////
// SUPABASE
//////////////////////////////////////////////////////

const sb = window.sb;

//////////////////////////////////////////////////////
// MODE
//////////////////////////////////////////////////////

let mode = "login";

//////////////////////////////////////////////////////
// INIT
//////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", () => {

  checkSession();

});

//////////////////////////////////////////////////////
// CHECK SESSION
//////////////////////////////////////////////////////

async function checkSession() {

  const { data } = await sb.auth.getSession();

  if (!data.session) return;

  const user = data.session.user;

  const { data: company } = await sb
    .from("companies")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!company) {
    window.location.href = "onboarding.html";
    return;
  }

  window.location.href = "dashboard.html";
}

//////////////////////////////////////////////////////
// TOGGLE MODE
//////////////////////////////////////////////////////

function toggleMode() {

  mode = mode === "login"
    ? "signup"
    : "login";

  document.getElementById("title").innerText =
    mode === "login"
      ? "Login"
      : "Create Account";

  document.getElementById("submitBtn").innerText =
    mode === "login"
      ? "Login"
      : "Create Account";

  showMessage("");
}

//////////////////////////////////////////////////////
// MESSAGE
//////////////////////////////////////////////////////

function showMessage(message, success = false) {

  const msg = document.getElementById("msg");

  msg.innerText = message;

  msg.style.color =
    success
      ? "#16a34a"
      : "#dc2626";
}

//////////////////////////////////////////////////////
// AUTH
//////////////////////////////////////////////////////

async function handleAuth() {

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  if (!email || !password) {

    showMessage("Email and password required");

    return;
  }

  //////////////////////////////////////////////////////
  // LOGIN
  //////////////////////////////////////////////////////

  if (mode === "login") {

    const { data, error } =
      await sb.auth.signInWithPassword({
        email,
        password
      });

    if (error) {

      showMessage(error.message);

      return;
    }

    showMessage(
      "Login successful...",
      true
    );

    const user = data.user;

    const { data: company } = await sb
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setTimeout(() => {

      if (!company) {
        window.location.href =
          "onboarding.html";
      }
      else {
        window.location.href =
          "dashboard.html";
      }

    }, 500);

    return;
  }

  //////////////////////////////////////////////////////
  // SIGNUP
  //////////////////////////////////////////////////////

  const { error } =
    await sb.auth.signUp({
      email,
      password
    });

  if (error) {

    showMessage(error.message);

    return;
  }

  showMessage(
    "Check your email to verify account ✔",
    true
  );
}

//////////////////////////////////////////////////////
// FORGOT PASSWORD
//////////////////////////////////////////////////////

async function forgotPassword() {

  const email =
    document.getElementById("email").value.trim();

  if (!email) {

    showMessage(
      "Enter your email first"
    );

    return;
  }

  const { error } =
    await sb.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          window.location.origin +
          "/reset-password.html"
      }
    );

  if (error) {

    showMessage(error.message);

    return;
  }

  showMessage(
    "Password reset email sent ✔",
    true
  );
}
