import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { APP_VERSION } from "./config";
import { db, ensureParticipant } from "./firebase";
import { screenName } from "./screens";

// Data layout (all documents are write-once, see firestore.rules):
//   participants/{uid}/sessions/{sessionId}
//   participants/{uid}/sessions/{sessionId}/steps/{index}
//   participants/{uid}/sessions/{sessionId}/feedback/final

export type Snapshot = Record<string, string | number | boolean | string[] | null>;

export type Step = {
  index: number;
  screen: number;
  toScreen: number;
  enteredAt: number;
  leftAt: number;
  state: Snapshot;
};

export type Feedback = {
  confidence: number;
  unclear: string;
  path: "early" | "full";
  state: Snapshot;
};

const sessionWrites = new Map<string, Promise<unknown>>();

async function write(path: string[], data: Record<string, unknown>) {
  if (!db) {
    // Firebase not configured yet (local development): just log.
    console.info("[tracking]", path.join("/"), data);
    return true;
  }
  const user = await ensureParticipant();
  if (!user) return false;
  try {
    await setDoc(doc(db, "participants", user.uid, ...path), { uid: user.uid, ...data });
    return true;
  } catch (error) {
    console.error("Saving failed", path.join("/"), error);
    return false;
  }
}

export function startSession(): string {
  const sessionId = crypto.randomUUID();
  const written = write(["sessions", sessionId], {
    sessionId,
    startedAt: serverTimestamp(),
    appVersion: APP_VERSION,
    userAgent: navigator.userAgent.slice(0, 500),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language.slice(0, 20),
  });
  sessionWrites.set(sessionId, written);
  return sessionId;
}

// Steps wait for the session document so data arrives in order.
export function logStep(sessionId: string, step: Step) {
  const previous = sessionWrites.get(sessionId) ?? Promise.resolve();
  const written = previous.then(() =>
    write(["sessions", sessionId, "steps", String(step.index).padStart(4, "0")], {
      sessionId,
      index: step.index,
      screen: step.screen,
      screenName: screenName(step.screen),
      toScreen: step.toScreen,
      toScreenName: screenName(step.toScreen),
      enteredAt: step.enteredAt,
      durationMs: Math.max(0, Math.round(step.leftAt - step.enteredAt)),
      state: step.state,
      appVersion: APP_VERSION,
      createdAt: serverTimestamp(),
    }),
  );
  sessionWrites.set(sessionId, written);
}

export function submitFeedback(sessionId: string, feedback: Feedback): Promise<boolean> {
  const previous = sessionWrites.get(sessionId) ?? Promise.resolve();
  const written = previous.then(() =>
    write(["sessions", sessionId, "feedback", "final"], {
      sessionId,
      ...feedback,
      unclear: feedback.unclear.slice(0, 2000),
      appVersion: APP_VERSION,
      createdAt: serverTimestamp(),
    }),
  );
  sessionWrites.set(sessionId, written);
  return written;
}
