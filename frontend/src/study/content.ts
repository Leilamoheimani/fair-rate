import type { Lang } from "../lib/texts";

// Usability test script: tasks, follow-up questions and the final questionnaire.
// Question ids become CSV columns, so keep them stable once data is collected,
// and keep the list of ids in sync with ANSWER_KEYS in firestore.rules.

type Localized = Record<Lang, string>;

export type Question =
  | { id: string; kind: "open"; text: Localized }
  | { id: string; kind: "scale"; text: Localized; ends: "ease" | "confidence" }
  | { id: string; kind: "choice"; text: Localized; options: { id: string; label: Localized }[] };

// When a task counts as "reached" without the participant pressing "I'm done".
export type Success = { kind: "screen"; screen: number } | { kind: "event"; name: string; value?: string };

export type Task = { text: Localized; success: Success; questions: Question[] };

const ease = (): Question => ({ id: "ease", kind: "scale", text: { de: "Wie leicht war das?", en: "How easy was that?" }, ends: "ease" });

export const tasks: Task[] = [
  {
    text: {
      de: "Schau dir die erste Seite an. Wenn du verstanden hast, was diese App macht, starte.",
      en: "Look at the first screen. When you understand what this app does, start.",
    },
    success: { kind: "screen", screen: 2 },
    questions: [
      { id: "summary", kind: "open", text: { de: "In einem Satz: Was macht FairRate?", en: "In one sentence: what does FairRate do?" } },
    ],
  },
  {
    text: {
      de: "Finde heraus, ab welchem Stundensatz sich deine Arbeit für dieses Webprojekt rechnet.",
      en: "Find out the hourly rate at which your work on this website project pays off.",
    },
    success: { kind: "screen", screen: 5 },
    questions: [
      ease(),
      { id: "number_meaning", kind: "open", text: { de: "Was hat dir die Zahl gesagt?", en: "What did the number tell you?" } },
    ],
  },
  {
    text: {
      de: "Lege den Leistungsumfang fest und entscheide, welches Angebot du deiner Kundin schicken würdest.",
      en: "Define the scope and decide which offer you would send to your client.",
    },
    success: { kind: "event", name: "offerChosen" },
    questions: [
      ease(),
      { id: "option_difference", kind: "open", text: { de: "Was war der Unterschied zwischen den drei Optionen?", en: "What was the difference between the three options?" } },
      {
        id: "prefer_single_price",
        kind: "choice",
        text: { de: "Hättest du lieber eine einzelne Zahl gesehen?", en: "Would you have preferred a single price?" },
        options: [
          { id: "yes", label: { de: "Ja", en: "Yes" } },
          { id: "no", label: { de: "Nein", en: "No" } },
          { id: "not_sure", label: { de: "Weiß nicht", en: "Not sure" } },
        ],
      },
    ],
  },
  {
    text: {
      de: "Deine Kundin sagt, ihr Budget liegt bei 3.100 €. Passe dein Angebot an und lade es als PDF herunter.",
      en: "Your client says her budget is 3.100 €. Adjust your offer and download it as a PDF.",
    },
    success: { kind: "event", name: "export", value: "pdf" },
    questions: [
      ease(),
      { id: "approach", kind: "open", text: { de: "Wie bist du vorgegangen — und warum?", en: "How did you go about it — and why?" } },
      { id: "warning_seen", kind: "open", text: { de: "Hast du eine Warnung gesehen? Wenn ja: Was hat sie dir gesagt?", en: "Did you see a warning? If so, what did it tell you?" } },
    ],
  },
];

export const finalQuestions: Question[] = [
  {
    id: "confidence",
    kind: "scale",
    text: { de: "Wie sicher würdest du dich fühlen, diesen Preis einer Kundin zu nennen?", en: "How confident would you feel quoting this price to a client?" },
    ends: "confidence",
  },
  { id: "unclear", kind: "open", text: { de: "Was ist dir unklar geblieben?", en: "What remained unclear to you?" } },
  { id: "most_confusing", kind: "open", text: { de: "Was war der verwirrendste Moment?", en: "What was the most confusing moment?" } },
  {
    id: "would_use",
    kind: "choice",
    text: { de: "Würdest du FairRate benutzen?", en: "Would you use FairRate?" },
    options: [
      { id: "yes", label: { de: "Ja", en: "Yes" } },
      { id: "maybe", label: { de: "Vielleicht", en: "Maybe" } },
      { id: "no", label: { de: "Nein", en: "No" } },
    ],
  },
  {
    id: "self_employed",
    kind: "choice",
    text: { de: "Bist du selbst selbstständig tätig?", en: "Are you self-employed yourself?" },
    options: [
      { id: "yes", label: { de: "Ja", en: "Yes" } },
      { id: "past", label: { de: "Früher", en: "In the past" } },
      { id: "no", label: { de: "Nein", en: "No" } },
    ],
  },
];

export const ui: Record<Lang, {
  taskOf: string; hide: string; show: string; done: string; stuck: string;
  introTitle: string; intro: string[]; introStart: string;
  questionOf: string; next: string; skip: string; placeholder: string;
  scaleEnds: Record<"ease" | "confidence", [string, string]>;
  thanksTitle: string; saving: string; saved: string; saveFailed: string; retry: string;
}> = {
  de: {
    taskOf: "AUFGABE {i} VON {n}", hide: "ausblenden", show: "einblenden", done: "Ich bin fertig", stuck: "Ich komme nicht weiter",
    introTitle: "Danke, dass du mitmachst 🙏",
    intro: [
      "Du testest einen Klick-Prototyp für mein Lernprojekt im Produktmanagement — ein Tool, mit dem Selbstständige ihre Preise berechnen.",
      "Stell dir vor: Du bist freiberufliche Designerin und hast gerade eine Anfrage für ein Webprojekt bekommen. Du willst wissen, was du verlangen kannst — und es der Kundin erklären können.",
      "Oben steht immer deine aktuelle Aufgabe. Wenn du nicht weiterkommst, tippe auf „Ich komme nicht weiter“ — auch das hilft mir sehr.",
      "Etwa 10 Minuten · anonym · keine persönlichen Daten.",
    ],
    introStart: "Test starten",
    questionOf: "FRAGE {i} VON {n}", next: "Weiter", skip: "Überspringen", placeholder: "Ein, zwei Sätze reichen",
    scaleEnds: { ease: ["sehr schwer", "sehr leicht"], confidence: ["gar nicht sicher", "sehr sicher"] },
    thanksTitle: "Vielen Dank 🙏",
    saving: "Deine Antworten werden gespeichert …",
    saved: "✓ Deine Antworten wurden gespeichert. Du kannst das Fenster jetzt schließen.",
    saveFailed: "Speichern hat nicht geklappt. Bitte prüfe deine Internetverbindung und versuch es nochmal.",
    retry: "Nochmal versuchen",
  },
  en: {
    taskOf: "TASK {i} OF {n}", hide: "hide", show: "show", done: "I'm done", stuck: "I'm stuck",
    introTitle: "Thank you for taking part 🙏",
    intro: [
      "You're testing a clickable prototype for my product management learning project — a tool that helps freelancers work out their prices.",
      "Imagine you're a freelance designer and have just received a request for a website project. You want to know what to charge — and be able to explain it to your client.",
      "Your current task is always shown at the top. If you get stuck, tap “I'm stuck” — that helps me a lot too.",
      "About 10 minutes · anonymous · no personal data.",
    ],
    introStart: "Start test",
    questionOf: "QUESTION {i} OF {n}", next: "Next", skip: "Skip", placeholder: "One or two sentences is enough",
    scaleEnds: { ease: ["very difficult", "very easy"], confidence: ["not confident at all", "very confident"] },
    thanksTitle: "Thank you 🙏",
    saving: "Saving your answers …",
    saved: "✓ Your answers have been saved. You can close this window now.",
    saveFailed: "Saving didn't work. Please check your internet connection and try again.",
    retry: "Try again",
  },
};
