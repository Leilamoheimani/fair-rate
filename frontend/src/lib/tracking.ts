import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { APP_VERSION } from "./config";
import { db, ensureParticipant } from "./firebase";
import type { Lang } from "./texts";

// Data layout (all documents are write-once, see firestore.rules):
//   participants/{uid}/runs/{runId}              one usability test run
//   participants/{uid}/runs/{runId}/tasks/{1-4}  outcome and answers per task
//   participants/{uid}/runs/{runId}/final/final  final questionnaire, path, events, choices

export type Answers = Record<string, string | number | null>;
export type Choices = Record<string, string | number | boolean | string[] | null>;

export type TaskResult = {
  task: number;
  status: "reached" | "self" | "stuck";
  durationMs: number;
  clicks: number;
  endScreen: string;
  answers: Answers;
};

export type FinalResult = {
  answers: Answers;
  totalMs: number;
  path: string[];
  events: string[];
  choices: Choices;
};

type Write = { path: string[]; data: Record<string, unknown> };

// Writes run one after another so the run document lands first.
let queue: Promise<unknown> = Promise.resolve();
let failed: Write[] = [];

async function write({ path, data }: Write) {
  if (!db) {
    // Firebase not configured (local development): just log.
    console.info("[tracking]", path.join("/"), data);
    return;
  }
  const user = await ensureParticipant();
  try {
    if (!user) throw new Error("not signed in");
    await setDoc(doc(db, "participants", user.uid, ...path), { uid: user.uid, ...data });
  } catch (error) {
    console.error("Saving failed", path.join("/"), error);
    failed.push({ path, data });
  }
}

function enqueue(item: Write) {
  queue = queue.then(() => write(item));
}

export function startRun(lang: Lang): string {
  const runId = crypto.randomUUID();
  enqueue({
    path: ["runs", runId],
    data: {
      runId,
      lang,
      startedAt: serverTimestamp(),
      appVersion: APP_VERSION,
      userAgent: navigator.userAgent.slice(0, 500),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language.slice(0, 20),
    },
  });
  return runId;
}

const clip = (answers: Answers): Answers =>
  Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 2000) : value]));

export function saveTask(runId: string, result: TaskResult) {
  enqueue({
    path: ["runs", runId, "tasks", String(result.task)],
    data: { runId, ...result, answers: clip(result.answers), appVersion: APP_VERSION, createdAt: serverTimestamp() },
  });
}

export function saveFinal(runId: string, result: FinalResult) {
  enqueue({
    path: ["runs", runId, "final", "final"],
    data: {
      runId,
      ...result,
      answers: clip(result.answers),
      path: result.path.slice(0, 500),
      events: result.events.slice(0, 500),
      appVersion: APP_VERSION,
      createdAt: serverTimestamp(),
    },
  });
}

/** Waits for all pending writes. Resolves to true if everything was saved. */
export async function flush(): Promise<boolean> {
  await queue;
  return failed.length === 0;
}

/** Sends the writes that failed (e.g. while offline) again. */
export function retryFailed(): Promise<boolean> {
  const items = failed;
  failed = [];
  items.forEach(enqueue);
  return flush();
}
