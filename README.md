# FairRate prototype

A clickable prototype (designed in Figma Make) used in a study with ~20–30 participants.
Every participant's path through the app, their choices and their final feedback are saved to Firebase.
The owner downloads everything as CSV from a private admin page.

- **App:** `https://<github-user>.github.io/fair-rate/`
- **Admin / data download:** `https://<github-user>.github.io/fair-rate/#/admin`

## What gets saved

Participants are anonymous (Firebase anonymous sign-in, no name or email).
Each time someone goes through the app, a **session** is created:

| Data | When | What |
|---|---|---|
| `sessions` | app opened / "Neues Angebot" | start time, device, screen size |
| `steps` | every time the participant leaves a screen | screen, next screen, time spent, all choices so far |
| `feedback` | "Feedback senden" on the last screen | confidence (1–5), "Was ist noch unklar?" text, early or full path |

Stored in Firestore under `participants/{uid}/sessions/{sessionId}/...`.
Nobody can change or delete saved data from the browser; only the admin account can read it.

## Downloading the data

1. Open `…/fair-rate/#/admin` and sign in with the admin Google account.
2. **Durchläufe als CSV**: one row per session (route, time per screen, all answers, feedback).
3. **Alle Schritte als CSV**: one row per screen visit (raw data).

The CSVs use `;` as separator and open directly in Excel (German) or Google Sheets.

## Changing and redeploying

Every push to `main` automatically:
1. builds the app and publishes it to GitHub Pages,
2. tests the Firestore security rules,
3. deploys the rules to Firebase (if the `FIREBASE_SERVICE_ACCOUNT` secret is set).

Check progress in the repo's **Actions** tab.

## Local development

```bash
cd frontend
npm install
npm run dev              # app without Firebase (saves are only logged to the console)
```

With the local Firebase emulators (needs Java):

```bash
npm install                                         # in the repo root
npx firebase emulators:start --only firestore,auth  # terminal 1
cd frontend && npm run dev:emulators                # terminal 2
npm run test:rules                                  # security rule tests
```

## Configuration

| What | Where |
|---|---|
| Firebase web config (not secret) | `frontend/src/lib/config.ts` |
| Admin email | `ADMIN_EMAIL` in `frontend/src/lib/config.ts` **and** `isAdmin()` in `firestore.rules` |
| Firebase project ID | `.firebaserc` |
| Repo name / URL path | `base` in `frontend/vite.config.ts` |
| Deploy credentials | GitHub → Settings → Secrets → `FIREBASE_SERVICE_ACCOUNT` (never commit it) |
