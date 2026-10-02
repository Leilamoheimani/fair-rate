import { useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { collectionGroup, getDocs, type DocumentData, type Timestamp } from "firebase/firestore";
import { ADMIN_EMAIL } from "./lib/config";
import { downloadCsv } from "./lib/csv";
import { auth, db, firebaseEnabled } from "./lib/firebase";
import { screenNames } from "./lib/screens";

type Data = { sessions: DocumentData[]; steps: DocumentData[]; feedback: DocumentData[] };

const iso = (value: Timestamp | number | undefined) =>
  value === undefined ? "" : new Date(typeof value === "number" ? value : value.toMillis()).toISOString();

const costLabels = ["Software-Abos", "KI-Tools", "Steuerrücklage", "Urlaub und Ausfallzeiten", "Unbezahlte Akquisezeit", "Versicherungen", "Weiterbildung"];

// Spread the state snapshot into flat CSV columns.
function flattenState(state: DocumentData = {}) {
  const { costValues, ...rest } = state;
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) row[`state_${key}`] = value;
  (costValues as string[] | undefined)?.forEach((value, index) => (row[`state_cost_${costLabels[index] ?? index}`] = value));
  return row;
}

function stepRows(data: Data) {
  return [...data.steps]
    .sort((a, b) => a.uid.localeCompare(b.uid) || a.sessionId.localeCompare(b.sessionId) || a.index - b.index)
    .map((step) => ({
      participantId: step.uid,
      sessionId: step.sessionId,
      index: step.index,
      screen: step.screenName,
      nextScreen: step.toScreenName,
      enteredAt: iso(step.enteredAt),
      durationSec: Math.round(step.durationMs / 100) / 10,
      ...flattenState(step.state),
    }));
}

function sessionRows(data: Data) {
  return [...data.sessions]
    .sort((a, b) => (a.startedAt?.toMillis() ?? 0) - (b.startedAt?.toMillis() ?? 0))
    .map((session) => {
      const steps = data.steps.filter((step) => step.sessionId === session.sessionId).sort((a, b) => a.index - b.index);
      const feedback = data.feedback.find((item) => item.sessionId === session.sessionId);
      const last = steps[steps.length - 1];
      const timePerScreen: Record<string, number> = {};
      for (const name of Object.values(screenNames)) timePerScreen[`sec_${name}`] = 0;
      for (const step of steps) timePerScreen[`sec_${step.screenName}`] = Math.round(((timePerScreen[`sec_${step.screenName}`] ?? 0) + step.durationMs / 1000) * 10) / 10;
      return {
        participantId: session.uid,
        sessionId: session.sessionId,
        startedAt: iso(session.startedAt),
        appVersion: session.appVersion,
        device: session.userAgent,
        viewport: session.viewport,
        stepsLogged: steps.length,
        furthestScreen: screenNames[Math.max(0, ...steps.flatMap((step) => [step.screen, step.toScreen]))],
        reachedEnd: steps.some((step) => step.toScreenName === "fertig"),
        path: feedback?.path ?? (last?.state?.early ? "early" : ""),
        totalSec: Math.round(steps.reduce((sum, step) => sum + step.durationMs, 0) / 100) / 10,
        route: steps.map((step) => step.screenName).concat(last ? [last.toScreenName] : []).join(" > "),
        feedbackSent: Boolean(feedback),
        confidence: feedback?.confidence ?? "",
        unclear: feedback?.unclear ?? "",
        feedbackAt: iso(feedback?.createdAt),
        ...timePerScreen,
        ...flattenState(feedback?.state ?? last?.state),
      };
    });
}

export default function Admin() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const isAdmin = Boolean(user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  useEffect(() => (auth ? onAuthStateChanged(auth, setUser) : setUser(null)), []);

  const load = async () => {
    if (!db) return;
    setError("");
    try {
      const [sessions, steps, feedback] = await Promise.all(
        ["sessions", "steps", "feedback"].map((name) => getDocs(collectionGroup(db!, name)).then((snap) => snap.docs.map((d) => d.data()))),
      );
      setData({ sessions, steps, feedback });
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
            {user && !user.isAnonymous && <p className="feedback-status">{user.email} hat keinen Zugriff.</p>}
            <div className="sticky-action static"><button className="button" onClick={() => signInWithPopup(auth!, new GoogleAuthProvider()).catch((err) => setError(err.message))}>Mit Google anmelden</button></div>
          </>}
          {isAdmin && <>
            <div className="intro compact"><h1>Ergebnisse</h1><p className="body">Angemeldet als {user!.email}</p></div>
            {data && <div className="empty-fields">
              <div><span>Teilnehmende</span><b>{new Set(data.sessions.map((s) => s.uid)).size}</b></div>
              <div><span>Durchläufe</span><b>{data.sessions.length}</b></div>
              <div><span>Bis zum Ende</span><b>{data.steps.filter((s) => s.toScreenName === "fertig").map((s) => s.sessionId).filter((id, i, all) => all.indexOf(id) === i).length}</b></div>
              <div><span>Feedback gesendet</span><b>{data.feedback.length}</b></div>
            </div>}
            <div className="sticky-action static double-action">
              <button className="button" disabled={!data} onClick={() => downloadCsv(`fairrate-durchlaeufe-${today}.csv`, sessionRows(data!))}>Durchläufe als CSV</button>
              <button className="button secondary" disabled={!data} onClick={() => downloadCsv(`fairrate-schritte-${today}.csv`, stepRows(data!))}>Alle Schritte als CSV</button>
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
