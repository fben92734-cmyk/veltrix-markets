let mode = "signup";
let csrfToken = "";
let toastTimer;
const $ = id => document.getElementById(id);
async function api(path, body, method = "POST") {
  const headers = { "Content-Type": "application/json" };
  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
  const res = await fetch(path, { method, headers, credentials: "same-origin", body: body ? JSON.stringify(body) : undefined });
  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  if (data.csrfToken) csrfToken = data.csrfToken;
  return data;
}
async function loadCsrf() { const data = await api("/api/csrf", null, "GET"); csrfToken = data.csrfToken; }
function renderMode() {
  const signup = mode === "signup";
  $("formEyebrow").textContent = signup ? "GET STARTED" : "WELCOME BACK";
  $("formTitle").textContent = signup ? "Create your account" : "Log in to Veltrix";
  $("formSubtitle").textContent = signup ? "Use an email address you can access and a unique password." : "Enter the email and password for your demo account.";
  $("nameField").classList.toggle("hidden", !signup);
  $("confirmField").classList.toggle("hidden", !signup);
  $("name").required = signup;
  $("confirm").required = signup;
  $("password").minLength = signup ? 12 : 1;
  $("password").autocomplete = signup ? "new-password" : "current-password";
  $("submitBtn").textContent = signup ? "Create demo account" : "Log in";
  $("switchText").textContent = signup ? "Already have an account?" : "New to Veltrix?";
  $("switchBtn").textContent = signup ? "Log in" : "Create account";
  $("authError").textContent = "";
}
function showDashboard(user) {
  $("authView").classList.add("hidden");
  $("dashboardView").classList.remove("hidden");
  $("userName").textContent = user.name || "Trader";
  $("userEmail").textContent = user.email || "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function showAuth() {
  $("dashboardView").classList.add("hidden");
  $("authView").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.remove("hidden");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add("hidden"), 3600);
}
$("switchBtn").addEventListener("click", () => { mode = mode === "signup" ? "login" : "signup"; renderMode(); });
$("authForm").addEventListener("submit", async e => {
  e.preventDefault(); $("authError").textContent = "";
  if (mode === "signup" && $("password").value !== $("confirm").value) { $("authError").textContent = "The passwords do not match."; return; }
  const button = $("submitBtn"); button.disabled = true;
  try {
    await loadCsrf();
    const body = { email: $("email").value, password: $("password").value };
    const endpoint = mode === "signup" ? "/api/register" : "/api/login";
    if (mode === "signup") body.name = $("name").value;
    const data = await api(endpoint, body);
    $("authForm").reset(); showDashboard(data.user);
    toast(mode === "signup" ? "Demo account created." : "You are signed in.");
  } catch (err) { $("authError").textContent = err.message; }
  finally { button.disabled = false; }
});
$("logoutBtn").addEventListener("click", async () => {
  try { await api("/api/logout", {}); csrfToken = ""; mode = "login"; renderMode(); showAuth(); toast("You have signed out."); await loadCsrf().catch(() => {}); }
  catch (err) { toast(err.message); }
});
$("buyBtn").addEventListener("click", () => toast("Demo only: no buy order was placed and no money moved."));
$("sellBtn").addEventListener("click", () => toast("Demo only: no sell order was placed and no money moved."));
(async function init() {
  try {
    await loadCsrf();
    const data = await api("/api/me", null, "GET");
    if (data.csrfToken) csrfToken = data.csrfToken;
    showDashboard(data.user);
  } catch (_) { /* visitor needs to sign in */ }
})();
