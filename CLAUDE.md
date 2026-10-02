# Project handoff: Figma Make task app → GitHub Pages + Firebase

> This file was written at the end of a claude.ai chat so work can continue in Claude Code.
> **Talk to the user in Persian (Farsi), casual tone.** Code, comments, commit messages and docs stay in English.
> The user is not a developer by background: explain what you're about to do before running anything that changes their accounts (git push, firebase deploy, creating secrets).

## 1. What the app is

A web app designed in **Figma Make**. Participants (users) are shown a set of **tasks** and complete them. The result of every completed task must be **stored**, and the owner must be able to get **all collected data in one place at the end** (see section 5).

The frontend code is the exported Figma Make zip (React + Vite + Tailwind, usually). It will be placed in `frontend/`.

## 2. Decisions already made

| Topic | Decision |
|---|---|
| Frontend hosting | **GitHub Pages** (static) |
| Backend | **Firebase** |
| Repo | **One monorepo** containing frontend and Firebase backend |
| Deploy | **GitHub Actions**: every push to `main` builds and deploys everything |

## 3. Proposed architecture (adapt once the real app is inspected)

GitHub Pages cannot run server code, so the browser talks to Firebase directly. Security comes from **Firestore Security Rules**, not from hiding keys.

- **Firestore** stores results.
- **Firebase Auth, Anonymous sign-in** gives each participant a stable `uid` without a signup flow. (Switch to email/Google sign-in only if the user needs real identities.)
- **No Cloud Functions at first.** They require the paid Blaze plan; Firestore + Auth + Rules work on the free Spark plan. Only add Functions if a real need appears (e.g. server-side validation that rules can't express), and tell the user about the billing change first.
- **Admin access** for the owner: a single admin identity (the owner's Google account email, or a custom claim) that can read all data.

Notes:
- The Firebase web config (`apiKey`, `projectId`, ...) is **not secret** by design. It can live in the frontend. Never commit service-account JSON or any admin credentials.
- Consider Firebase **App Check** later if abuse becomes a concern.

### Proposed data model (adjust to the real tasks)

```
participants/{uid}
  createdAt, displayName?, metadata?
participants/{uid}/results/{taskId}
  taskId, answer/payload, startedAt, completedAt, durationMs, appVersion
```

Security rules principles:
- A signed-in participant can **create** and **read** only their own documents.
- Results are **write-once**: no update or delete from clients.
- Validate field types and size limits in rules.
- Only the admin can read across all participants.
- Default deny for everything else.

## 4. Target repo layout

```
.
├── CLAUDE.md
├── README.md
├── .github/workflows/deploy.yml
├── firebase.json
├── .firebaserc
├── firestore.rules
├── firestore.indexes.json
├── frontend/            # Figma Make export (Vite app)
│   ├── package.json
│   ├── vite.config.ts   # set base: '/<repo-name>/'
│   └── src/lib/firebase.ts   # initializeApp + db + anonymous auth
├── scripts/
│   └── export-results.mjs    # Admin SDK → CSV (see section 5)
└── functions/           # only if really needed
```

## 5. Getting the data to the owner at the end

Pick with the user (ask them, recommend the first one):
1. **Admin page** in the frontend, protected by Google sign-in restricted to the owner's email, with a "Download CSV" button.
2. **Local script** `scripts/export-results.mjs` using the Firebase Admin SDK (service account kept locally, never committed) that writes a CSV.
3. Firestore scheduled export to Cloud Storage (needs Blaze plan, probably overkill).

## 6. CI/CD (GitHub Actions) requirements

On push to `main`:
1. Install and build `frontend/` with the Firebase config injected (via repo variables or committed public config).
2. Deploy `frontend/dist` to **GitHub Pages** (`actions/upload-pages-artifact` + `actions/deploy-pages`; repo Settings → Pages → Source = GitHub Actions).
3. Deploy Firebase backend parts: `firebase deploy --only firestore:rules,firestore:indexes` (plus `functions` only if present). Authenticate with a **service-account secret** stored in GitHub Secrets (e.g. `FIREBASE_SERVICE_ACCOUNT`), not a personal token.
4. Run on pull requests as build-only (no deploy).

Gotchas:
- Vite needs `base: '/<repo-name>/'` for project Pages sites.
- If the app uses `react-router`, switch to `HashRouter` (or add a 404 fallback) or refreshes will 404 on Pages.
- Figma Make exports sometimes lack `package.json` / `vite.config` / `tsconfig`. If so, scaffold them (Vite + React + TS), install the dependencies the code imports, and confirm `npm run dev` works before anything else.
- Add the Pages domain `<user>.github.io` to **Firebase Auth → Authorized domains**, or sign-in will fail in production.
- Pages on a **private** repo needs a paid GitHub plan. Public repo is fine, but then the code is public.

## 7. What the user has to do themselves (you cannot do these for them)

- [ ] Install Node.js LTS and Git (check with `node -v`, `git -v`; help them install if missing).
- [ ] Create a **Firebase project** at console.firebase.google.com, add a **Web app**, and give you the config object.
- [ ] In the console: enable **Firestore** (production mode) and **Authentication → Anonymous** (and Google if admin page is chosen).
- [ ] Create a **GitHub repo** (or approve `gh repo create` after `gh auth login` done by them).
- [ ] Log in to Firebase CLI (`firebase login`) and GitHub CLI themselves.
- [ ] Create the **service account key** and paste it into GitHub → Settings → Secrets → `FIREBASE_SERVICE_ACCOUNT` (walk them through it, never ask them to paste the key in chat).
- [ ] Put the Figma Make zip (Code tab → Download code) into the project folder.

## 8. Inputs still missing from the user (ask early)

1. The Figma Make zip.
2. What exactly counts as a "task" and **what data to record per task** (free text, multiple choice, timing, files?).
3. Do participants need to identify themselves (name/email) or can they be anonymous?
4. Approximate number of participants.
5. Preferred way to receive the final data (section 5).
6. GitHub username + desired repo name, public or private.
7. Firebase project ID once created.
8. Custom domain? (default: no)

## 9. Suggested order of work

1. Inspect the zip, scaffold missing build files, get `npm run dev` working in `frontend/`.
2. Create the monorepo structure, `.gitignore` (node_modules, dist, service-account files, `.env*`).
3. Add `firebase.ts`, anonymous auth, and replace any mock/local task-state with Firestore writes.
4. Write `firestore.rules` + indexes; test with the Firebase emulator (`firebase emulators:start`) before deploying.
5. Implement the export path from section 5.
6. Write `deploy.yml`, set secrets, push, verify the Pages URL and a real end-to-end submission.
7. Write a short Persian-friendly `README.md` describing how to redeploy and how to download the data.
