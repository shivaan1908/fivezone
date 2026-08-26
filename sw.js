/* ============================================================
   FIVEZONE — service worker
   Caches just the static app shell (HTML/CSS/JS/icons) so the
   board still loads offline or on a flaky connection. Firebase,
   Open-Meteo, fonts, and any other cross-origin/non-GET requests
   are deliberately left alone — a stale cached response for a
   live chat or auth call would be worse than no caching at all.
   ============================================================ */

const CACHE_NAME = "fivezone-shell-v1";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./app.html",
  "./css/style.css",
  "./js/config.js",
  "./js/firebase-config.js",
  "./js/backend.js",
  "./js/auth.js",
  "./js/theme.js",
  "./js/clocks.js",
  "./js/globe.js",
  "./js/weather.js",
  "./js/presence.js",
  "./js/planner.js",
  "./js/bestTime.js",
  "./js/chat.js",
  "./js/events.js",
  "./js/app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .catch((err) => console.warn("FIVEZONE SW: shell caching failed", err))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // leave Firebase/Open-Meteo/fonts alone

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
