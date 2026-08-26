# FIVEZONE — GitHub Pages + Firebase

A private board for five friends across time zones: live flip clocks with weather and an online-now dot, a day/night globe, a meeting planner with a "best time to call everyone" finder, presence status, group chat with emoji reactions and notifications, and a shared upcoming-calls list with calendar (.ics) export. Installable as a PWA, with a light "daylight" theme alongside the original dark departure-board look.

This version is prepared for **GitHub Pages + Firebase Anonymous Authentication + Cloud Firestore**.

## What's new

- **Weather** — each row shows live current conditions for that friend's city (via [Open-Meteo](https://open-meteo.com/), no API key needed). Toggle °C/°F in the header.
- **Online-now dot** — a small teal dot lights up next to a name when that friend's tab has been active in the last 90 seconds.
- **Day/night globe** — the globe now shades whichever half of Earth is currently in darkness, computed from the real subsolar point.
- **Best time to call everyone** — in the meeting planner, click "Find the best time to call everyone" to scan the next five days for windows where everyone's local clock is within waking hours (see `WAKE_START` / `WAKE_END` in `js/config.js`). "Use this time" drops it straight into the upcoming-calls form.
- **Upcoming calls** — replaces the old single "next call" field with a shared list. Anyone can add a call with a title/time/note, see a live countdown to the soonest one, download a `.ics` for their own calendar app, or remove one.
- **Chat reactions** — tap an emoji under any message to react (👍❤️😂🎉😮 quick-pick, or + for more). Reactions are a separate Firestore collection so the message log itself stays append-only.
- **Notifications** — optional browser notifications and a soft ping sound when a new message arrives while the tab is in the background; the tab title shows an unread count until you come back.
- **Daylight theme** — toggle between the original dark board and a light palette from the header (or the login screen); the choice is remembered per browser.
- **Installable / offline shell** — FIVEZONE is a PWA now (`manifest.json` + `sw.js`). "Install" it from the browser menu; the app shell (HTML/CSS/JS/icons) is cached for offline loading, while chat/status/events/weather still need a connection to sync live.



## Firestore collections

```text
messages/{auto-id}     chat messages (append-only; includes a client-generated id)
statuses/{friend-name} status dropdown + presence heartbeat (used for the online-now dot)
events/{auto-id}       shared "upcoming calls" list (replaces the old meta/next_call)
reactions/{auto-id}    emoji reactions, keyed to a message's id
```

If you're upgrading an existing Firebase project, re-publish `firestore.rules` — it now also covers the `events` and `reactions` collections. The old `meta/next_call` document is no longer used and can be deleted.

## Updating

```bash
git add .
git commit -m "Update FIVEZONE"
git push
```

GitHub Actions will redeploy the site.
