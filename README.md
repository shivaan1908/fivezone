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

## Login: no email accounts required

Each friend simply chooses their name and enters their PIN. There are **no email addresses, inboxes, or Firebase user accounts to create**.

Example configuration lives in `js/config.js`:

```js
{ name: "Shivaan", pin: "2580", ... }
```

### Important security note

Because this is a static GitHub Pages app, the five PINs are present in the browser code. That makes them a **convenience gate, not strong authentication**. Anyone who can inspect the site files could discover the PINs. Firebase Anonymous Authentication still gives the app an authenticated Firebase session, and Firestore rules require that session.

For a private five-friend dashboard this is usually fine. Do **not** use this setup for sensitive/private data.

## 1. Create the Firebase project

1. Open the Firebase Console: https://console.firebase.google.com/
2. Create a project.
3. Add a **Web app** (`</>`).
4. Copy its Firebase config into `js/firebase-config.js`.
5. In **Authentication → Sign-in method**, enable **Anonymous**.

You do **not** need to create users under Authentication → Users.

## 2. Create Firestore

1. Open **Firestore Database** in Firebase Console.
2. Create the database.
3. Deploy the rules from `firestore.rules` in the Firebase console's **Rules** tab.
4. Publish the rules.

The rules require an authenticated Firebase session for shared data.

## 3. Set your PINs

Open `js/config.js` and change the five PINs if you want.

```js
const FRIENDS = [
  { name: "Shivaan", pin: "2580", ... },
  { name: "Aryan",   pin: "3141", ... },
  { name: "Ahaan",   pin: "2718", ... },
  { name: "Varun",   pin: "1618", ... },
  { name: "Jashn",   pin: "4242", ... },
];
```

These example PINs are placeholders. **Change them before publishing.**

## 4. Put it on GitHub

Create a repository such as `fivezone`, then put the contents of this folder in the repository root:

```text
index.html
app.html
css/
js/
firestore.rules
.nojekyll
.github/workflows/pages.yml
README.md
```

Commit and push to the `main` branch.

## 5. Enable GitHub Pages

In the repository:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

The included workflow deploys the site automatically whenever you push to `main`.

Your project site will normally be available at:

`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

## 6. Firebase authorized domain

In Firebase Console, check:

**Authentication → Settings → Authorized domains**

Make sure your GitHub Pages hostname is authorized, for example:

`YOUR-USERNAME.github.io`

## 7. Firebase web config

Paste the normal Firebase web config into `js/firebase-config.js`. Those browser-side values are not the same thing as a Firebase Admin SDK private key. **Never commit service-account JSON or Admin SDK private keys.**

## Local testing

A simple local server is preferable:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

If Firebase is not configured, the app falls back to localStorage so you can still test the UI.

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
