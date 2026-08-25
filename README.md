# FIVEZONE — GitHub Pages + Firebase

A private board for five friends across time zones: live clocks, globe, meeting planner, status, group chat, and next-call countdown.

This version is prepared for **GitHub Pages + Firebase Anonymous Authentication + Cloud Firestore**.

## Login: no email accounts required

Each friend simply chooses their name and enters their PIN. There are **no email addresses, inboxes, or Firebase user accounts to create**.

Example configuration lives in `js/config.js`.

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

These example PINs are placeholders. **Change them before publishing.**

## 4. Put it on GitHub

Create a repository such as `fivezone`, then put the contents of this folder in the repository root.

## 5. Enable GitHub Pages

In the repository:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

The included workflow deploys the site automatically whenever you push to `main`.

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
messages/{auto-id}
statuses/{friend-name}
meta/next_call
```

## Updating

```bash
git add .
git commit -m "Update FIVEZONE"
git push
```

GitHub Actions will redeploy the site.