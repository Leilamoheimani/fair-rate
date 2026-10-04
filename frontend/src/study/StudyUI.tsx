import { useRef, useState } from "react";
import type { Lang } from "../lib/texts";
import type { Answers } from "../lib/tracking";
import { tasks, ui, type Question } from "./content";

export function Intro({ lang, setLang, onStart }: { lang: Lang; setLang: (lang: Lang) => void; onStart: () => void }) {
  const u = ui[lang];
  return (
    <div className="study-overlay">
      <div className="study-sheet" role="dialog" aria-modal="true">
        <div className="lang-toggle">{(["de", "en"] as const).map((code) => <button key={code} className={lang === code ? "active" : ""} onClick={() => setLang(code)}>{code.toUpperCase()}</button>)}</div>
        <h1>{u.introTitle}</h1>
        {u.intro.map((paragraph) => <p className="body" key={paragraph}>{paragraph}</p>)}
        <button className="button study-cta" onClick={onStart}>{u.introStart}</button>
      </div>
    </div>
  );
}

export function TaskBar({ lang, index, onDone, onStuck }: { lang: Lang; index: number; onDone: () => void; onStuck: () => void }) {
  const [minimized, setMinimized] = useState(false);
  const u = ui[lang];
  return (
    <div className={`taskbar ${minimized ? "min" : ""}`} role="status">
      <div className="taskbar-row">
        <span>{u.taskOf.replace("{i}", String(index + 1)).replace("{n}", String(tasks.length))}</span>
        <button onClick={() => setMinimized(!minimized)}>{minimized ? u.show : u.hide}</button>
      </div>
      {!minimized && <>
        <p>{tasks[index].text[lang]}</p>
        <div className="taskbar-actions"><button onClick={onDone}>{u.done}</button><button className="stuck" onClick={onStuck}>{u.stuck}</button></div>
      </>}
    </div>
  );
}

export function QuestionSheet({ lang, questions, onDone }: { lang: Lang; questions: Question[]; onDone: (answers: Answers) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [value, setValue] = useState<string | number | null>(null);
  const finished = useRef(false);
  const u = ui[lang];
  const question = questions[index];

  const next = (answer: string | number | null) => {
    // Ignore a second tap on the last question; it would save the answers twice.
    if (finished.current) return;
    const all = { ...answers, [question.id]: typeof answer === "string" ? answer.trim() || null : answer };
    setAnswers(all);
    setValue(null);
    if (index + 1 < questions.length) setIndex(index + 1);
    else {
      finished.current = true;
      onDone(all);
    }
  };

  return (
    <div className="study-overlay">
      <div className="study-sheet" role="dialog" aria-modal="true" key={index}>
        <p className="eyebrow">{u.questionOf.replace("{i}", String(index + 1)).replace("{n}", String(questions.length))}</p>
        <h2>{question.text[lang]}</h2>
        {question.kind === "scale" && <>
          <div className="scale">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={value === n ? "selected" : ""} onClick={() => setValue(n)}>{n}</button>)}</div>
          <div className="scale-ends"><span>{u.scaleEnds[question.ends][0]}</span><span>{u.scaleEnds[question.ends][1]}</span></div>
        </>}
        {question.kind === "choice" && <div className="choice-list">{question.options.map((option) => <button key={option.id} className={value === option.id ? "selected" : ""} onClick={() => setValue(option.id)}>{option.label[lang]}</button>)}</div>}
        {question.kind === "open" && <textarea autoFocus placeholder={u.placeholder} maxLength={2000} value={(value as string) ?? ""} onChange={(event) => setValue(event.target.value)} />}
        <button className="button study-cta" onClick={() => next(value)}>{u.next}</button>
        <button className="text-link centered-link" onClick={() => next(null)}>{u.skip}</button>
      </div>
    </div>
  );
}

export function ThankYou({ lang, saveState, saveError, onRetry }: { lang: Lang; saveState: "saving" | "saved" | "error"; saveError: string; onRetry: () => void }) {
  const u = ui[lang];
  return (
    <section className="phone thanks">
      <div className="screen">
        <div className="success-art"><span>✓</span></div>
        <div className="intro"><h1>{u.thanksTitle}</h1></div>
        {saveState === "saving" && <p className="body thanks-status">{u.saving}</p>}
        {saveState === "saved" && <p className="feedback-status sent">{u.saved}</p>}
        {saveState === "error" && <>
          <p className="feedback-status">{u.saveFailed}</p>
          <p className="body thanks-status"><small>({saveError})</small></p>
          <button className="button study-cta" onClick={onRetry}>{u.retry}</button>
        </>}
      </div>
    </section>
  );
}
