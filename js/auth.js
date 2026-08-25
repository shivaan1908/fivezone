function firebaseReady() {
  return typeof firebase !== "undefined" && firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_");
}
function getFriend(name) { return FRIENDS.find((f) => f.name === name) || null; }
function populateFriendSelect() {
  const sel = document.getElementById("who");
  sel.innerHTML = '<option value="" disabled selected>Select your name…</option>';
  FRIENDS.forEach((f) => { const opt = document.createElement("option"); opt.value = f.name; opt.textContent = `${f.name} — ${f.city}`; sel.appendChild(opt); });
}
function setAuthModeUI() {
  const passLabel = document.querySelector('label[for="passcode"]'); const pass = document.getElementById("passcode"); const hint = document.getElementById("auth-hint");
  if (passLabel) passLabel.textContent = "FiveZone password";
  if (pass) { pass.placeholder = "Enter your password"; pass.inputMode = "text"; pass.autocomplete = "current-password"; }
  if (hint) hint.textContent = "Your name selects your FiveZone account. Your password is never stored in this website.";
}
async function handleLogin(e) {
  e.preventDefault(); const who = document.getElementById("who").value; const pass = document.getElementById("passcode").value; const errEl = document.getElementById("err"); errEl.textContent = "";
  if (!who) { errEl.textContent = "Pick who you are first."; return; }
  const friend = getFriend(who); if (!friend) { errEl.textContent = "That friend isn't configured."; return; }
  if (!pass) { errEl.textContent = "Enter your password."; return; }
  if (!firebaseReady()) { errEl.textContent = "Firebase is not configured."; return; }
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    await firebase.auth().signInWithEmailAndPassword(friend.email, pass);
    sessionStorage.setItem("fivezone_user", who);
    sessionStorage.setItem("fivezone_auth_mode", "firebase-email");
    window.location.href = "app.html";
  } catch (err) {
    console.error("FiveZone sign-in failed", err);
    errEl.textContent = err && err.code === "auth/invalid-credential" ? "Incorrect password." : "Login failed. Check your password and try again.";
  }
}
function requireLogin() { const who = sessionStorage.getItem("fivezone_user"); if (!who) { window.location.href = "index.html"; return null; } return who; }
async function logout() { try { if (firebaseReady() && firebase.apps.length && firebase.auth().currentUser) await firebase.auth().signOut(); } catch (e) { console.warn("Firebase sign-out failed", e); } sessionStorage.removeItem("fivezone_user"); sessionStorage.removeItem("fivezone_auth_mode"); window.location.href = "index.html"; }
document.addEventListener("DOMContentLoaded", () => { const form = document.getElementById("login-form"); if (!form) return; populateFriendSelect(); setAuthModeUI(); form.addEventListener("submit", handleLogin); });