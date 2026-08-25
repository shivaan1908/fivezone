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
  if (passLabel) passLabel.textContent = "Your PIN";
  if (pass) { pass.placeholder = "Enter your PIN"; pass.inputMode = "numeric"; pass.autocomplete = "off"; }
  if (hint) hint.textContent = firebaseReady() ? "No email account needed. Your PIN opens your FiveZone profile." : "Firebase is not configured yet — local demo mode is active.";
}
async function handleLogin(e) {
  e.preventDefault(); const who = document.getElementById("who").value; const pass = document.getElementById("passcode").value.trim(); const errEl = document.getElementById("err"); errEl.textContent = "";
  if (!who) { errEl.textContent = "Pick who you are first."; return; }
  const friend = getFriend(who); if (!friend) { errEl.textContent = "That friend isn't configured."; return; }
  if (pass !== String(friend.pin)) { errEl.textContent = "Wrong PIN."; return; }
  if (firebaseReady()) {
    try { if (!firebase.apps.length) firebase.initializeApp(firebaseConfig); await firebase.auth().signInAnonymously(); sessionStorage.setItem("fivezone_auth_mode", "firebase-anonymous"); }
    catch (err) { console.error(err); errEl.textContent = "Firebase login failed. Check Anonymous Authentication is enabled."; return; }
  } else sessionStorage.setItem("fivezone_auth_mode", "local");
  sessionStorage.setItem("fivezone_user", who); window.location.href = "app.html";
}
function requireLogin() { const who = sessionStorage.getItem("fivezone_user"); if (!who) { window.location.href = "index.html"; return null; } return who; }
async function logout() { try { if (firebaseReady() && firebase.apps.length && firebase.auth().currentUser) await firebase.auth().signOut(); } catch (e) { console.warn("Firebase sign-out failed", e); } sessionStorage.removeItem("fivezone_user"); sessionStorage.removeItem("fivezone_auth_mode"); window.location.href = "index.html"; }
document.addEventListener("DOMContentLoaded", () => { const form = document.getElementById("login-form"); if (!form) return; populateFriendSelect(); setAuthModeUI(); form.addEventListener("submit", handleLogin); });