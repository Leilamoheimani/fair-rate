# FairRate prototype

A clickable prototype (designed in Figma Make) used in a usability test with ~20–30 participants.
Participants get 4 tasks on top of the prototype, answer a few questions after each task and a short
questionnaire at the end. Everything is saved to Firebase, and the owner downloads it as CSV from a private admin page.

- **App / test:** `https://leilamoheimani.github.io/fair-rate/` (English: add `?lang=en`)
- **Admin / data download:** `https://leilamoheimani.github.io/fair-rate/#/admin`

## How the test works

1. Intro sheet (DE/EN toggle) explains the scenario → "Test starten".
2. A task bar above the app shows the current task with "Ich bin fertig" / "Ich komme nicht weiter".
   A task also ends automatically when the participant reaches its goal:

   | Task | Reached when |
   |---|---|
   | 1 Understand the start page | leaves the start page |
   | 2 Find the hourly floor | reaches the "Untergrenze" screen |
   | 3 Choose an offer | leaves the offer options ("Weiter zum Angebot" or "Preis manuell anpassen") |
   | 4 Adjust to 3.100 € budget and download PDF | taps "PDF herunterladen" |

3. After each task, a few questions (1–5 rating, free text, multiple choice); all can be skipped.
4. Final questionnaire, then a thank-you screen that confirms the answers were saved.

Tasks and questions live in `frontend/src/study/content.ts`. If you add or rename a question id,
also update the list in `firestore.rules` (`answers()`).

## What gets saved

Participants are anonymous (Firebase anonymous sign-in, no name or email).

| Document | When | What |
|---|---|---|
| `runs/{runId}` | "Test starten" | language, start time, device, screen size |
| `runs/{runId}/tasks/{1-4}` | after each task's questions | status (reached / marked done / stuck), time, clicks, screen where it ended, answers |
| `runs/{runId}/final/final` | after the final questionnaire | final answers, total time, screen path, events (e.g. warning path, PDF export), all choices in the app |

Stored in Firestore under `participants/{uid}/runs/...`. Task results are saved one by one, so partial runs are kept too.
Nobody can change or delete saved data from the browser; only the admin account can read it.

## Downloading the data

1. Open `…/fair-rate/#/admin` and sign in with the admin Google account.
2. **Ergebnisse als CSV**: one row per test (every task outcome and every answer side by side, plus choices).
3. **Aufgaben als CSV**: one row per task (to compare tasks across participants).
4. **Fragen-Übersicht als CSV**: which question belongs to which column (`T2_ease`, `final_unclear`, …).

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
| Admin account (Firebase UID, shown on `#/admin` after Google sign-in) | `ADMIN_UID` in `frontend/src/lib/config.ts` **and** `isAdmin()` in `firestore.rules` |
| Firebase project ID | `.firebaserc` |
| Repo name / URL path | `base` in `frontend/vite.config.ts` |
| Deploy credentials | GitHub → Settings → Secrets → `FIREBASE_SERVICE_ACCOUNT` (never commit it) |
