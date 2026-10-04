import { useRef, useState } from "react";
import type { Lang } from "../lib/texts";
import { flush, retryFailed, saveFinal, saveTask, startRun, type Answers, type Choices, type TaskResult } from "../lib/tracking";
import { finalQuestions, tasks, type Question } from "./content";

export type Phase = "intro" | "task" | "final" | "done";
export type Sheet = { id: number; questions: Question[]; onDone: (answers: Answers) => void };

// Drives the usability test: intro → tasks (each followed by questions) → final questionnaire → done.
export function useStudy(getChoices: () => Choices) {
  const [lang, setLang] = useState<Lang>(() => (new URLSearchParams(window.location.search).get("lang") === "en" ? "en" : "de"));
  const [phase, setPhase] = useState<Phase>("intro");
  const [taskIndex, setTaskIndex] = useState(0);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [saveState, setSaveState] = useState<"saving" | "saved" | "error">("saving");
  // Mutable run data; refs so event handlers never see stale values.
  const run = useRef({ id: "", t0: 0, taskT0: 0, task: -1, clicks: 0, busy: false, screen: "", path: [] as string[], events: [] as string[] });
  const choices = useRef(getChoices);
  choices.current = getChoices;

  const seconds = () => Math.round((Date.now() - run.current.t0) / 1000);

  const startTask = (index: number) => {
    Object.assign(run.current, { task: index, taskT0: Date.now(), clicks: 0, busy: false });
    setTaskIndex(index);
  };

  const start = (screenName: string) => {
    const r = run.current;
    r.id = startRun(lang);
    r.t0 = Date.now();
    r.screen = screenName;
    r.path = [`${screenName}@0`];
    setPhase("task");
    startTask(0);
  };

  const finish = (answers: Answers) => {
    const r = run.current;
    saveFinal(r.id, { answers, totalMs: Date.now() - r.t0, path: r.path, events: r.events, choices: choices.current() });
    setSheet(null);
    setPhase("done");
    flush().then((ok) => setSaveState(ok ? "saved" : "error"));
  };

  const askQuestions = (status: TaskResult["status"]) => {
    const r = run.current;
    const index = r.task;
    const result = { task: index + 1, status, durationMs: Date.now() - r.taskT0, clicks: r.clicks, endScreen: r.screen };
    setSheet({
      id: index,
      questions: tasks[index].questions,
      onDone: (answers) => {
        saveTask(r.id, { ...result, answers });
        if (index + 1 < tasks.length) {
          setSheet(null);
          startTask(index + 1);
        } else {
          r.task = -1;
          setPhase("final");
          setSheet({ id: tasks.length, questions: finalQuestions, onDone: finish });
        }
      },
    });
  };

  /** Participant pressed "I'm done" or "I'm stuck". */
  const endTask = (status: "self" | "stuck") => {
    const r = run.current;
    if (r.task < 0 || r.busy) return;
    r.busy = true;
    askQuestions(status);
  };

  const check = (kind: "screen" | "event", name: string | number, value?: string) => {
    const r = run.current;
    if (r.task < 0 || r.busy) return;
    const success = tasks[r.task].success;
    const reached = success.kind === "screen"
      ? kind === "screen" && name === success.screen
      : kind === "event" && name === success.name && (success.value === undefined || success.value === value);
    if (!reached) return;
    r.busy = true;
    setTimeout(() => askQuestions("reached"), 450);
  };

  /** Call on every screen change. */
  const onScreen = (screen: number, screenName: string) => {
    const r = run.current;
    if (!r.id || r.screen === screenName) return;
    r.screen = screenName;
    r.path.push(`${screenName}@${seconds()}`);
    check("screen", screen);
  };

  /** Records a meaningful interaction, e.g. logEvent("export", "pdf"). */
  const logEvent = (name: string, value?: string | number) => {
    const r = run.current;
    if (!r.id) return;
    r.events.push(`${name}${value === undefined ? "" : `=${value}`}@${seconds()}`);
    check("event", name, value === undefined ? undefined : String(value));
  };

  const countClick = () => {
    if (run.current.task >= 0) run.current.clicks++;
  };

  const retry = () => {
    setSaveState("saving");
    retryFailed().then((ok) => setSaveState(ok ? "saved" : "error"));
  };

  return { lang, setLang, phase, taskIndex, sheet, saveState, start, endTask, onScreen, logEvent, countClick, retry };
}
