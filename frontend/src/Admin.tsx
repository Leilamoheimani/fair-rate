import { useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { collectionGroup, getDocs, type DocumentData, type Timestamp } from "firebase/firestore";
import { ADMIN_UID } from "./lib/config";
import { downloadCsv } from "./lib/csv";
import { auth, db, firebaseEnabled } from "./lib/firebase";
import { finalQuestions, tasks } from "./study/content";

type Data = { runs: DocumentData[]; tasks: DocumentData[]; final: DocumentData[] };

const iso = (value: Timestamp | undefined) => (value ? value.toDate().toISOString() : "");
const sec = (ms: number | undefined) => (ms === undefined ? "" : Math.round(ms / 100) / 10);
const statusLabel: Record<string, string> = { reached: "erreicht", self: "selbst als fertig markiert", stuck: "abgebrochen" };

const costLabels = ["Software-Abos", "KI-Tools", "Steuerrücklage", "Urlaub und Ausfallzeiten", "Unbezahlte Akquisezeit", "Versicherungen", "Weiterbildung"];

// Spread the choices snapshot into flat CSV columns.
function flattenChoices(choices: DocumentData = {}) {
  const { costValues, ...rest } = choices;
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) row[`choice_${key}`] = value;
  (costValues as string[] | undefined)?.forEach((value, index) => (row[`choice_cost_${costLabels[index] ?? index}`] = value));
  return row;
}

const byStart = (a: DocumentData, b: DocumentData) => (a.startedAt?.toMillis() ?? 0) - (b.startedAt?.toMillis() ?? 0);

// One row per test run: every task outcome and every answer side by side.
function runRows(data: Data) {
  return [...data.runs].sort(byStart).map((run) => {
    const final = data.final.find((item) => item.runId === run.runId);
    const row: Record<string, unknown> = {
      participantId: run.uid,
      runId: run.runId,
      startedAt: iso(run.startedAt),
      language: run.lang,
      appVersion: run.appVersion,
      device: run.userAgent,
      viewport: run.viewport,
      completed: Boolean(final),
      totalMin: final ? Math.round(final.totalMs / 600) / 100 : "",
    };
    tasks.forEach((task, index) => {
      const result = data.tasks.find((item) => item.runId === run.runId && item.task === index + 1);
      row[`T${index + 1}_status`] = result ? statusLabel[result.status] ?? result.status : "nicht erreicht";
      row[`T${index + 1}_sec`] = sec(result?.durationMs);
      row[`T${index + 1}_clicks`] = result?.clicks ?? "";
      row[`T${index + 1}_endScreen`] = result?.endScreen ?? "";
      for (const question of task.questions) row[`T${index + 1}_${question.id}`] = result?.answers?.[question.id] ?? "";
    });
    for (const question of finalQuestions) row[`final_${question.id}`] = final?.answers?.[question.id] ?? "";
    row.path = final?.path?.join(" > ") ?? "";
    row.events = final?.events ?? "";
    return { ...row, ...flattenChoices(final?.choices) };
  });
}

// One row per task, handy for comparing tasks across participants.
function taskRows(data: Data) {
  const starts = new Map(data.runs.map((run) => [run.runId, run]));
  return [...data.tasks]
    .sort((a, b) => byStart(starts.get(a.runId) ?? {}, starts.get(b.runId) ?? {}) || a.task - b.task)
    .map((result) => ({
      participantId: result.uid,
      runId: result.runId,
      language: starts.get(result.runId)?.lang ?? "",
      task: result.task,
      taskText: tasks[result.task - 1]?.text.de ?? "",
      status: statusLabel[result.status] ?? result.status,
      sec: sec(result.durationMs),
      clicks: result.clicks,
      endScreen: result.endScreen,
      ...Object.fromEntries(Object.entries(result.answers ?? {}).map(([key, value]) => [`answer_${key}`, value])),
      savedAt: iso(result.createdAt),
    }));
}

// Question texts, so the CSV column names can be looked up.
function questionRows() {
  return [
    ...tasks.flatMap((task, index) => task.questions.map((question) => ({ column: `T${index + 1}_${question.id}`, question: question.text.de, task: task.text.de }))),
    ...finalQuestions.map((question) => ({ column: `final_${question.id}`, question: question.text.de, task: "Abschlussfragen" })),
  ];
}

export default function Admin() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const isAdmin = Boolean(user && !user.isAnonymous && user.uid === ADMIN_UID);

  useEffect(() => (auth ? onAuthStateChanged(auth, setUser) : setUser(null)), []);

  const load = async () => {
    if (!db) return;
    setError("");
    try {
      const [runs, taskResults, final] = await Promise.all(
        ["runs", "tasks", "final"].map((name) => getDocs(collectionGroup(db!, name)).then((snap) => snap.docs.map((d) => d.data()))),
      );
      setData({ runs, tasks: taskResults, final });
    } catch (err) {
      setError(`Laden fehlgeschlagen: ${(err as Error).message}`);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="app-shell">
      <section className="phone admin">
        <header className="topbar"><span className="brand">FairRate · Admin</span></header>
        <div className="screen">
          {!firebaseEnabled && <p className="body">Firebase ist noch nicht konfiguriert (frontend/src/lib/config.ts).</p>}
          {firebaseEnabled && user === undefined && <p className="body">Lädt …</p>}
          {firebaseEnabled && user !== undefined && !isAdmin && <>
            <div className="intro compact"><h1>Daten herunterladen</h1><p className="body">Melde dich mit dem Admin-Google-Konto an.</p></div>
            {user && !user.isAnonymous && <div className="info-row"><p>{user.email} hat noch keinen Zugriff. Deine Konto-ID (für ADMIN_UID):<br /><b className="admin-uid">{user.uid}</b></p></div>}
            <div className="sticky-action static"><button className="button" onClick={() => signInWithPopup(auth!, new GoogleAuthProvider()).catch((err) => setError(err.message))}>Mit Google anmelden</button></div>
          </>}
          {isAdmin && <>
            <div className="intro compact"><h1>Ergebnisse</h1><p className="body">Angemeldet als {user!.email}</p></div>
            {data && <div className="empty-fields">
              <div><span>Teilnehmende</span><b>{new Set(data.runs.map((run) => run.uid)).size}</b></div>
              <div><span>Gestartete Tests</span><b>{data.runs.length}</b></div>
              <div><span>Komplett abgeschlossen</span><b>{data.final.length}</b></div>
              {tasks.map((_, index) => {
                const results = data.tasks.filter((item) => item.task === index + 1);
                return <div key={index}><span>Aufgabe {index + 1}: erreicht / bearbeitet</span><b>{results.filter((item) => item.status === "reached").length} / {results.length}</b></div>;
              })}
            </div>}
            <div className="sticky-action static double-action">
              <button className="button" disabled={!data} onClick={() => downloadCsv(`fairrate-usertests-${today}.csv`, runRows(data!))}>Ergebnisse als CSV (1 Zeile pro Test)</button>
              <button className="button secondary" disabled={!data} onClick={() => downloadCsv(`fairrate-aufgaben-${today}.csv`, taskRows(data!))}>Aufgaben als CSV (1 Zeile pro Aufgabe)</button>
              <button className="button secondary" onClick={() => downloadCsv("fairrate-fragen.csv", questionRows())}>Fragen-Übersicht als CSV</button>
              <button className="text-link centered-link" onClick={load}>Neu laden</button>
              <button className="text-link centered-link" onClick={() => signOut(auth!)}>Abmelden</button>
            </div>
          </>}
          {error && <p className="feedback-status">{error}</p>}
        </div>
      </section>
    </main>
  );
}
