const authForm = document.getElementById("authForm");
const authStatus = document.getElementById("authStatus");
const submitButton = document.getElementById("submitButton");
const logoutButton = document.getElementById("logoutButton");
const isAdminLogin = document.body.dataset.role === "admin";
let isRegisterMode = false;

function showAuthStatus(message, isError = false) {
  authStatus.textContent = message;
  authStatus.classList.toggle("text-danger", isError);
  authStatus.classList.toggle("text-success", !isError);
}

function updateUserMode() {
  document.getElementById("authTitle").textContent =
    isRegisterMode ? "Create Account" : "User Login";
  document.getElementById("authDescription").textContent =
    isRegisterMode
      ? "Create an account to get started."
      : "Sign in to your customer account.";
  document.getElementById("password").autocomplete =
    isRegisterMode ? "new-password" : "current-password";
  submitButton.textContent = isRegisterMode ? "Create Account" : "Sign In";
  document.getElementById("switchPrompt").textContent =
    isRegisterMode ? "Already registered?" : "New customer?";
  document.getElementById("modeToggle").textContent =
    isRegisterMode ? "Sign in" : "Create an account";
}

async function signOut() {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (!response.ok) {
    showAuthStatus("Could not sign out. Please try again.", true);
    return;
  }
  logoutButton.hidden = true;
  authForm.hidden = false;
  showAuthStatus("You have signed out.");
}

if (!isAdminLogin) {
  document.getElementById("modeToggle").addEventListener("click", () => {
    isRegisterMode = !isRegisterMode;
    updateUserMode();
    showAuthStatus("");
  });
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  showAuthStatus("");

  const endpoint = isAdminLogin
    ? "/api/auth/admin/login"
    : isRegisterMode
      ? "/api/auth/register"
      : "/api/auth/login";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: document.getElementById("username").value.trim(),
        password: document.getElementById("password").value
      })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || "Sign in failed.");
    }

    if (isAdminLogin) {
      window.location.replace("/");
      return;
    }

    showAuthStatus(
      `${isAdminLogin ? "Admin" : "User"} signed in as ${result.username}.`
    );
    authForm.hidden = true;
    logoutButton.hidden = false;
  } catch (error) {
    showAuthStatus(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

logoutButton.addEventListener("click", signOut);

fetch("/api/auth/me")
  .then(async (response) => {
    if (!response.ok) {
      return;
    }
    const session = await response.json();
    if (session.role !== (isAdminLogin ? "admin" : "user")) {
      return;
    }
    if (isAdminLogin) {
      window.location.replace("/");
      return;
    }
    authForm.hidden = true;
    logoutButton.hidden = false;
    showAuthStatus(
      `Signed in as ${session.username}${isAdminLogin ? " (admin)" : ""}.`
    );
  })
  .catch((error) => {
    console.error("Could not check the current sign-in status.", error);
  });
