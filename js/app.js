document.addEventListener("DOMContentLoaded", async () => {
  const who = requireLogin();
  if (!who) return;
  document.getElementById("who-am-i").textContent = who;
  const mode = await Backend.init();
  const modeNote = document.getElementById("mode-note");
  if (modeNote) modeNote.textContent = mode === "cloud" ? "Connected to shared FiveZone data." : "Local demo mode — Firebase is not connected.";

  Clocks.start(); Globe.start(); Planner.start();

  const status = document.getElementById("my-status");
  if (status) {
    status.addEventListener("change", async () => {
      const next = status.value;
      const ownBadge = document.getElementById(`status-${who.replace(/\s+/g, "_")}`);
      // Update our own badge immediately; Firestore confirmation follows.
      if (ownBadge) {
        ownBadge.textContent = next;
        ownBadge.className = `badge ${next.toLowerCase()}`;
      }
      try {
        await Backend.setStatus(who, next);
      } catch (err) {
        console.error("Could not update status", err);
      }
    });
  }

  Backend.onStatuses(all => {
    FRIENDS.forEach(f => {
      const el = document.getElementById(`status-${f.name.replace(/\s+/g, "_")}`);
      const value = all[f.name]?.status;
      if (el) {
        el.textContent = value || "—";
        el.className = `badge ${value ? value.toLowerCase() : "away"}`;
      }
    });
    if (status && all[who]?.status) status.value = all[who].status;
  }, err => console.error("Could not load statuses", err));

  const log = document.getElementById("chat-log");
  if (log) {
    Backend.onMessages(msgs => {
      log.innerHTML = msgs.length
        ? msgs.map(m => `<div class="chat-msg"><div class="meta"><span>${escapeHtml(m.name)}</span><span>${new Date(m.ts).toLocaleString()}</span></div><div>${escapeHtml(m.text)}</div></div>`).join("")
        : '<div class="chat-empty">No messages yet.</div>';
      log.scrollTop = log.scrollHeight;
    }, err => console.error("Could not load messages", err));
  }

  const chatForm = document.getElementById("chat-form");
  if (chatForm) {
    chatForm.addEventListener("submit", async e => {
      e.preventDefault();
      const input = document.getElementById("chat-input");
      const text = input?.value.trim();
      if (!text) return;
      try { await Backend.sendMessage(who, text); input.value = ""; }
      catch (err) { console.error("Could not send message", err); }
    });
  }

  let nextCall = null;
  const display = document.getElementById("nextcall-display");
  Backend.onNextCall(v => { nextCall = v; renderCountdown(); }, err => console.error("Could not load next call", err));
  setInterval(renderCountdown, 1000);
  function renderCountdown() {
    if (!display) return;
    if (!nextCall) { display.textContent = "No call scheduled yet."; return; }
    const diff = new Date(nextCall) - new Date();
    if (diff <= 0) { display.innerHTML = '<div class="cd-time">Call time!</div>'; return; }
    const s = Math.floor(diff / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    display.innerHTML = `<div><div class="eyebrow">Next call</div><div class="cd-time">${d ? d + "d " : ""}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}</div></div>`;
  }

  const eventForm = document.getElementById("event-form");
  const eventWhen = document.getElementById("event-when");
  if (eventForm && eventWhen) {
    eventForm.addEventListener("submit", async e => {
      e.preventDefault();
      if (!eventWhen.value) return;
      try { await Backend.setNextCall(new Date(eventWhen.value).toISOString()); eventForm.reset(); }
      catch (err) { console.error("Could not save call", err); }
    });
  }
  const logoutButton = document.getElementById("logout-btn");
  if (logoutButton) logoutButton.addEventListener("click", () => logout());
});

function escapeHtml(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
