import { useEffect, useRef, useState } from "react";
import { logStep, startSession, submitFeedback, type Snapshot } from "./lib/tracking";

type Screen = 0 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 12;

const text = {
  back: "Zurück",
  step: "Schritt",
  of: "von",
  startTitle: "Was ist dein Projekt wert?",
  startSub: "FairRate berechnet, ab welchem Preis sich deine Arbeit rechnet — und macht daraus drei Angebote, die du deiner Kundin erklären kannst.",
  start: "Los geht's",
  startNote: "etwa 5 Minuten · ohne Konto",
  howTitle: "So funktioniert's",
  howSteps: [
    ["Projekt beschreiben", "Drei kurze Fragen zu Beruf, Projektart und Umfang."],
    ["Kosten eintragen", "Wir fragen gezielt nach — auch nach dem, was man gern vergisst."],
    ["Untergrenze sehen", "Ab welchem Preis sich deine Arbeit wirklich rechnet."],
    ["Umfang festlegen", "Was zum Projekt gehört und was nicht."],
    ["Drei Angebote erhalten", "Basis, Empfohlen und Premium — fertig zum Versenden."],
  ],
  resultTitle: "Was du am Ende bekommst",
  professionTitle: "Was machst du beruflich?",
  professions: [
    ["Design", "UX/UI, Grafik, Produkt"],
    ["Entwicklung", "Web, App, IT"],
    ["Beratung", "Strategie, Marketing, Prozesse"],
    ["Coaching", "Einzel, Team, Training"],
    ["Text und Content", "Texte, Redaktion, Social"],
    ["Etwas anderes", ""],
    ["Handwerk und Produkte", "bald verfügbar"],
  ],
  projectTitle: "Welche Art von Projekt?",
  projectMap: {
    Design: ["Website", "App-Design", "Branding", "UX-Audit"],
    Entwicklung: ["Website", "Web-App", "Mobile App", "Wartung"],
    Beratung: ["Workshop", "Strategieprojekt", "Laufende Begleitung"],
    Coaching: ["Einzelcoaching", "Gruppenprogramm", "Workshop"],
    "Text und Content": ["Website-Texte", "Kampagne", "Content-Paket"],
  },
  otherProject: "Projektart beschreiben",
  sizeTitle: "Wie groß ist das Projekt ungefähr?",
  sizes: ["Klein · bis 2 Wochen", "Mittel · 2 bis 6 Wochen", "Groß · über 6 Wochen"],
  estimateButton: "Schätzung ansehen",
  noNumbers: "Keine Zahlen abgefragt",
  estimate: "Schätzung",
  estimateValue: "3.900 – 5.100 €",
  standards: "mit Standardwerten berechnet",
  empty: "noch nicht ausgefüllt",
  emptyFields: ["Eigene Kosten", "Auslastung", "Leistungsumfang"],
  estimateExplain: "Mit deinen echten Kosten wird daraus deine persönliche Untergrenze.",
  refine: "Genauer machen",
  enough: "Reicht mir so",
  costsTitle: "Deine Kosten",
  costsSub: "Wir fragen gezielt nach — damit nichts untergeht.",
  costs: ["Software-Abos", "KI-Tools", "Steuerrücklage", "Urlaub und Ausfallzeiten", "Unbezahlte Akquisezeit", "Versicherungen", "Weiterbildung"],
  aiTip: "Und deine KI-Abos? Ein typischer Stack kostet 50–80 € im Monat.",
  privateNote: "Nur für diese Berechnung. Jederzeit änderbar und löschbar.",
  calculate: "Untergrenze berechnen",
  floorLabel: "DEINE UNTERGRENZE",
  floor: "68 €/h",
  floorHigh: "74 €/h",
  floorSub: "Darunter rechnet sich deine Arbeit nicht.",
  why: "Warum dieser Preis?",
  whyRows: [["Fixkosten", "1.240 €"], ["Steuerrücklage", "620 €"], ["Marge", "780 €"]],
  assumptions: ["Auslastung", "Steuerrücklage", "Gewinnmarge"],
  defaults: ["Standardwert 75 %", "Standardwert 30 %", "Standardwert 20 %"],
  adjusted: "von dir angepasst",
  toScope: "Weiter zum Leistungsumfang",
  scopeTitle: "Was gehört zum Projekt?",
  scopeSub: "Erst danach wird gerechnet — so lässt sich dein Preis verteidigen.",
  services: "Leistungen",
  serviceItems: ["Konzept", "Design", "Entwicklung", "Texte", "SEO-Grundlagen"],
  revisions: "Korrekturschleifen",
  revisionItems: ["1", "2", "3", "unbegrenzt"],
  deadline: "Deadline",
  specifics: "Besonderheiten",
  specificItems: ["Eilauftrag", "Unklare Anforderungen", "Neue Kundin"],
  skip: "Überspringen",
  skipNote: "Dann wird dein Angebot als vorläufig markiert.",
  create: "Angebot erstellen",
  offersTitle: "Drei Angebotsoptionen",
  offersSub: "Jede Option hat einen eigenen Leistungsumfang.",
  options: ["Basis", "Empfohlen", "Premium"],
  prices: ["3.000 €", "4.200 €", "5.600 €"],
  optionScope: [
    ["3 Seiten", "2 Korrekturschleifen", "ohne Texte", "ohne Support"],
    ["5 Seiten", "3 Korrekturschleifen", "Text für die Startseite", "2 Wochen Support"],
    ["5 Seiten plus Buchung", "Korrekturen unbegrenzt", "alle Texte", "3 Monate Support"],
  ],
  included: "Leistungsumfang ansehen",
  close: "Leistungsumfang schließen",
  offerNext: "Weiter zum Angebot",
  manual: "Preis manuell anpassen",
  adjustedScope: "Umfang angepasst · Entwicklung entfernt",
  priceTitle: "Preis anpassen",
  clientBudget: "Deine Kundin nennt ein Budget von 3.100 €.",
  price: "Preis",
  warning: "12 % unter deiner Untergrenze",
  warningText: "Bei diesem Preis bleibt nach Kosten und Steuer nichts übrig.",
  reduce: "Umfang reduzieren",
  anyway: "Trotzdem so anbieten",
  backOptions: "Zurück zu den Optionen",
  prepareTitle: "Dein Angebot",
  client: "Name der Kundin oder Firma",
  project: "Projekttitel",
  valid: "Gültig bis",
  message: "Persönliche Nachricht (optional)",
  offerNote: "Diese Angaben erscheinen nur im Angebot. Deine Kosten und deine Untergrenze werden nie angezeigt.",
  branding: "Branding",
  logo: "Logo hochladen",
  color: "Akzentfarbe wählen",
  next: "Weiter",
  sendTitle: "Angebot versenden",
  pdf: "PDF herunterladen",
  file: "Angebot_Kundin_Website.pdf",
  link: "Link kopieren",
  share: "fairrate.de/a/FR-4200",
  mail: "In E-Mail öffnen",
  sendNote: "FairRate verschickt nichts selbst. Du entscheidest, wann und wie dein Angebot rausgeht.",
  ready: "Angebot ist bereit",
  done: "Fertig",
  questions: "Wenn die Kundin nachfragt",
  situations: ["Rabattanfrage", "„Warum so teuer?“", "Budget ist kleiner", "Scope wurde größer", "Eilauftrag", "Absage unter Untergrenze"],
  replies: [
    "Gern passe ich den Umfang an — die Basis-Option liegt bei 3.000 €.",
    "Der Preis ergibt sich aus dem vereinbarten Umfang und der Zeit für ein hochwertiges Ergebnis.",
    "Wir können die wichtigsten Leistungen priorisieren und den Umfang entsprechend anpassen.",
    "Ich ergänze die neue Leistung transparent im Angebot und passe den Preis entsprechend an.",
    "Für die kürzere Vorlaufzeit plane ich Kapazität exklusiv für das Projekt ein.",
    "Danke für die Rückmeldung. Unter meiner Untergrenze kann ich das Projekt leider nicht wirtschaftlich umsetzen.",
  ],
  confidence: "Wie sicher fühlst du dich jetzt mit diesem Preis?",
  unclear: "Was ist noch unklar?",
  newOffer: "Neues Angebot",
  sendFeedback: "Feedback senden",
  sendingFeedback: "Wird gesendet …",
  feedbackSent: "Danke für dein Feedback!",
  feedbackError: "Senden hat nicht geklappt. Bitte versuch es nochmal.",
  shortReady: "Deine erste Schätzung ist bereit. Du kannst jederzeit zurückkommen und sie mit deinen echten Kosten präzisieren.",
} as const;

function ArrowLeft() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>;
}
function Chevron({ up = false }: { up?: boolean }) {
  return <svg className={up ? "rotate" : ""} viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
}
function Check() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}
function Spark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 14.2 9l6.3 2.3-6.3 2.2-2.2 7-2.2-7-6.3-2.2L9.8 9 12 2.5Z" /></svg>;
}
function CopyIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
}
function Button({ children, onClick, secondary = false, disabled = false }: { children: React.ReactNode; onClick: () => void; secondary?: boolean; disabled?: boolean }) {
  return <button className={`button ${secondary ? "secondary" : ""}`} onClick={onClick} disabled={disabled}>{children}</button>;
}
function Field({ label, value, onChange, type = "text", placeholder = "", suffix = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; suffix?: string }) {
  return <label className="field"><span>{label}</span><span className="input-wrap"><input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />{suffix && <b>{suffix}</b>}</span></label>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(0);
  const [early, setEarly] = useState(false);
  const [profession, setProfession] = useState("");
  const [project, setProject] = useState("");
  const [customProject, setCustomProject] = useState("");
  const [size, setSize] = useState("");
  const [costChecked, setCostChecked] = useState<number[]>([0, 1]);
  const [costValues, setCostValues] = useState(["49", "65", "", "", "", "", ""]);
  const [whyOpen, setWhyOpen] = useState(false);
  const [assumptions, setAssumptions] = useState([60, 30, 20]);
  const [services, setServices] = useState<number[]>([0, 1, 2]);
  const [revision, setRevision] = useState(2);
  const [deadline, setDeadline] = useState("2025-06-30");
  const [specifics, setSpecifics] = useState<number[]>([]);
  const [option, setOption] = useState(1);
  const [openOption, setOpenOption] = useState<number | null>(1);
  const [reduced, setReduced] = useState(false);
  const [offer, setOffer] = useState({ client: "Studio Nord", project: "Website", valid: "2025-06-30", message: "" });
  const [shareDone, setShareDone] = useState("");
  const [replyOpen, setReplyOpen] = useState<number | null>(0);
  const [confidence, setConfidence] = useState(4);
  const [unclear, setUnclear] = useState("");
  const [whyOpened, setWhyOpened] = useState(false);
  const [scopeSkipped, setScopeSkipped] = useState(false);
  const [shareActions, setShareActions] = useState<string[]>([]);
  const [confidenceChanged, setConfidenceChanged] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const touchStart = useRef(0);
  const t = text;

  // Everything the participant has chosen so far, stored with every step.
  const snapshot: Snapshot = {
    early,
    profession,
    project,
    customProject,
    size,
    costsChecked: costChecked.map((index) => t.costs[index]),
    costValues: [...costValues],
    utilization: assumptions[0],
    taxReserve: assumptions[1],
    margin: assumptions[2],
    whyOpened,
    services: services.map((index) => t.serviceItems[index]),
    revisions: t.revisionItems[revision],
    deadline,
    specifics: specifics.map((index) => t.specificItems[index]),
    scopeSkipped,
    optionViewed: t.options[option],
    scopeOpenFor: openOption === null ? null : t.options[openOption],
    reduced,
    offerClient: offer.client,
    offerProject: offer.project,
    offerValid: offer.valid,
    offerMessage: offer.message,
    shareActions,
    confidence,
    confidenceChanged,
    unclear,
  };
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const tracking = useRef<{ sessionId: string; index: number; screen: Screen; enteredAt: number; newSession: boolean } | null>(null);
  useEffect(() => {
    const now = Date.now();
    const current = tracking.current;
    if (!current) {
      tracking.current = { sessionId: startSession(), index: 0, screen, enteredAt: now, newSession: false };
      return;
    }
    if (current.screen === screen) return;
    logStep(current.sessionId, { index: current.index, screen: current.screen, toScreen: screen, enteredAt: current.enteredAt, leftAt: now, state: snapshotRef.current });
    if (current.newSession) {
      tracking.current = { sessionId: startSession(), index: 0, screen, enteredAt: now, newSession: false };
    } else {
      tracking.current = { ...current, index: current.index + 1, screen, enteredAt: now };
    }
  }, [screen]);

  const sendFeedback = async () => {
    if (!tracking.current) return;
    setFeedbackStatus("sending");
    const ok = await submitFeedback(tracking.current.sessionId, { confidence, unclear, path: early ? "early" : "full", state: snapshotRef.current });
    setFeedbackStatus(ok ? "sent" : "error");
  };

  const progress = ({ 2: 1, 4: 2, 5: 3, 6: 4, 7: 5 } as Record<number, number>)[screen];
  const projectOptions = (text.projectMap as Record<string, readonly string[]>)[profession] ?? [];
  const canEstimate = profession && (project || customProject) && size;

  const back = () => {
    const paths: Record<number, Screen> = { 2: 0, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 7, 11: 9, 12: 11 };
    setScreen(screen === 12 && early ? 3 : (paths[screen] ?? 0));
  };
  const toggle = (value: number, list: number[], setter: (next: number[]) => void) => setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  const startNew = () => {
    if (screen === 12 && tracking.current) {
      tracking.current.newSession = true;
      setFeedbackStatus("idle");
      setConfidenceChanged(false);
      setShareActions([]);
    }
    setEarly(false);
    setScreen(2);
  };
  const handleSwipe = (end: number) => {
    const delta = touchStart.current - end;
    if (Math.abs(delta) < 45) return;
    setOption((current) => delta > 0 ? Math.min(2, current + 1) : Math.max(0, current - 1));
  };
  const download = () => {
    const file = new Blob(["FairRate Angebot\n\nBasis 3.000 €\nEmpfohlen 4.200 €\nPremium 5.600 €"], { type: "text/plain" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = t.file;
    anchor.click();
    URL.revokeObjectURL(url);
    setShareDone(t.pdf);
    setShareActions((items) => [...items, "pdf"]);
  };

  return (
    <main className="app-shell">
      <section className="phone" aria-label="FairRate — Mobile Prototype">
        <header className="topbar">
          <button className="brand" onClick={() => setScreen(0)}><span className="brand-mark"><Spark /></span><span>FairRate</span></button>
        </header>

        {screen !== 0 && (
          <div className="progress-row">
            <button className="back" onClick={back}><ArrowLeft /><span>{t.back}</span></button>
            {progress ? <span>{t.step} {progress} {t.of} 5</span> : <span />}
            <div className="progress-track"><i style={{ transform: `scaleX(${progress ? progress / 5 : 0})` }} /></div>
          </div>
        )}

        <div className="screen" key={screen}>
          {screen === 0 && <>
            <div className="hero-art"><div className="mini-card one"><span /><span /><b>€</b></div><div className="mini-card two"><span /><strong>4.200</strong></div><div className="orbit"><Spark /></div></div>
            <div className="intro onboarding-intro"><p className="eyebrow">FairRate</p><h1>{t.startTitle}</h1><p className="body">{t.startSub}</p></div>
            <div className="onboarding-action"><Button onClick={startNew}>{t.start}</Button><small>⏱ {t.startNote.split(" · ")[0]} · 🔒 {t.startNote.split(" · ")[1]}</small></div>
            <section className="onboarding-section">
              <h2>{t.howTitle}</h2>
              <div className="onboarding-steps">{t.howSteps.map(([title, description], index) => <div key={title}><span>{index + 1}</span><i><Spark /></i><p><b>{title}</b><small>{description}</small></p></div>)}</div>
            </section>
            <section className="onboarding-section result-section">
              <h2>{t.resultTitle}</h2>
              <div className="result-preview">{t.options.map((name, index) => <div className={index === 1 ? "featured" : ""} key={name}><span>{name}</span><b>{t.prices[index]}</b><i /></div>)}</div>
            </section>
          </>}

          {screen === 2 && <>
            <div className="question-block"><h1>{t.professionTitle}</h1><div className="profession-grid">{t.professions.map(([name, sub], index) => <button key={name} disabled={index === 6} className={profession === name ? "selected" : ""} onClick={() => { setProfession(name); setProject(""); }}><b>{name}</b>{sub && <span>{sub}</span>}</button>)}</div></div>
            {profession && <div className="question-block"><h2>{t.projectTitle}</h2>{projectOptions.length ? <div className="choice-row">{projectOptions.map((item) => <button className={project === item ? "selected" : ""} key={item} onClick={() => setProject(item)}>{item}</button>)}</div> : <Field label={t.otherProject} value={customProject} onChange={setCustomProject} />}</div>}
            {(project || customProject) && <div className="question-block"><h2>{t.sizeTitle}</h2><div className="chips compact-chips">{t.sizes.map((item) => <button className={size === item ? "selected" : ""} key={item} onClick={() => setSize(item)}><span>{size === item && <Check />}</span>{item}</button>)}</div></div>}
            <div className="sticky-action"><Button disabled={!canEstimate} onClick={() => setScreen(3)}>{t.estimateButton}</Button><small className="action-note">{t.noNumbers}</small></div>
          </>}

          {screen === 3 && <>
            <div className="intro"><span className="neutral-badge">{t.estimate}</span><h1 className="estimate-value">{t.estimateValue}</h1><p className="body">{t.standards}</p></div>
            <div className="empty-fields">{t.emptyFields.map((field) => <div key={field}><span>{field}</span><em>{t.empty}</em></div>)}</div>
            <div className="info-row"><span><Spark /></span><p>{t.estimateExplain}</p></div>
            <div className="sticky-action double-action"><Button onClick={() => setScreen(4)}>{t.refine}</Button><Button secondary onClick={() => { setEarly(true); setScreen(12); }}>{t.enough}</Button></div>
          </>}

          {screen === 4 && <>
            <div className="intro compact"><h1>{t.costsTitle}</h1><p className="body">{t.costsSub}</p></div>
            <div className="cost-list">{t.costs.map((cost, index) => <div className={index === 2 ? "current" : ""} key={cost}><button className={`cost-check ${costChecked.includes(index) ? "checked" : ""}`} onClick={() => toggle(index, costChecked, setCostChecked)}>{costChecked.includes(index) && <Check />}</button><span>{cost}</span><label><input value={costValues[index]} onChange={(event) => { const values = [...costValues]; values[index] = event.target.value; setCostValues(values); }} /><b>€</b></label>{index === 2 && <p>{t.aiTip}</p>}</div>)}</div>
            <div className="privacy-note"><span><Check /></span>{t.privateNote}</div>
            <div className="sticky-action"><Button onClick={() => setScreen(5)}>{t.calculate}</Button></div>
          </>}

          {screen === 5 && <>
            <div className="intro floor-intro"><p className="eyebrow">{t.floorLabel}</p><h1>{assumptions[0] < 60 ? t.floorHigh : t.floor}</h1><p className="body">{t.floorSub}</p></div>
            <div className="minimum-card">
              <button className="expander" onClick={() => { setWhyOpen(!whyOpen); setWhyOpened(true); }}><span>{t.why}</span><Chevron up={whyOpen} /></button>
              <div className={`expand-content price-breakdown ${whyOpen ? "open" : ""}`}><div>{t.whyRows.map(([label, value]) => <p key={label}><span>{label}</span><b>{value}</b></p>)}</div></div>
            </div>
            <div className="assumptions">{t.assumptions.map((label, index) => <div className={index === 0 && assumptions[0] !== 75 ? "changed" : ""} key={label}><div><b>{label}</b><strong>{assumptions[index]} %</strong></div><input className="slider" type="range" min={index === 0 ? 40 : 10} max={index === 0 ? 90 : 40} step="5" value={assumptions[index]} onChange={(event) => { const next = [...assumptions]; next[index] = Number(event.target.value); setAssumptions(next); }} /><p>{t.defaults[index]}{index === 0 && assumptions[0] !== 75 && <em>{t.adjusted}</em>}</p></div>)}</div>
            <div className="sticky-action"><Button onClick={() => setScreen(6)}>{t.toScope}</Button></div>
          </>}

          {screen === 6 && <>
            <div className="intro compact"><h1>{t.scopeTitle}</h1><p className="body">{t.scopeSub}</p></div>
            <div className="scope-groups">
              <div><b>{t.services}</b><div className="choice-row">{t.serviceItems.map((item, index) => <button className={services.includes(index) ? "selected" : ""} key={item} onClick={() => toggle(index, services, setServices)}>{item}</button>)}</div></div>
              <div><b>{t.revisions}</b><div className="choice-row">{t.revisionItems.map((item, index) => <button className={revision === index ? "selected" : ""} key={item} onClick={() => setRevision(index)}>{item}</button>)}</div></div>
              <Field label={t.deadline} type="date" value={deadline} onChange={setDeadline} />
              <div><b>{t.specifics}</b><div className="choice-row">{t.specificItems.map((item, index) => <button className={specifics.includes(index) ? "selected" : ""} key={item} onClick={() => toggle(index, specifics, setSpecifics)}>{item}</button>)}</div></div>
            </div>
            <button className="text-link left-link" onClick={() => { setScopeSkipped(true); setScreen(7); }}>{t.skip}</button><small className="skip-note">{t.skipNote}</small>
            <div className="sticky-action"><Button onClick={() => { setScopeSkipped(false); setScreen(7); }}>{t.create}</Button></div>
          </>}

          {screen === 7 && <>
            <div className="intro compact offers-intro"><h1>{t.offersTitle}</h1><p className="body">{t.offersSub}</p></div>
            {reduced && <div className="adjusted-banner"><Check /><span>{t.adjustedScope}</span></div>}
            <div className="offer-viewport" onTouchStart={(event) => touchStart.current = event.touches[0].clientX} onTouchEnd={(event) => handleSwipe(event.changedTouches[0].clientX)}>
              <div className="offer-track" style={{ transform: `translateX(calc(${option * -100}% - ${option * 12}px))` }}>
                {t.options.map((name, index) => <article className={`offer-card ${index === 1 ? "recommended" : ""}`} key={name}>
                  {index === 1 && <span className="recommend-label">{t.options[1]}</span>}
                  <div className="offer-head"><span><b>{name}</b><small>{index === 1 ? t.offersSub : `Option ${index + 1}`}</small></span><i>{index + 1}</i></div>
                  <strong className="offer-price">{reduced && index === 1 ? "3.700 €" : t.prices[index]}</strong>
                  <button className="scope-toggle" onClick={() => setOpenOption(openOption === index ? null : index)}>{openOption === index ? t.close : t.included}<Chevron up={openOption === index} /></button>
                  <div className={`offer-scope ${openOption === index ? "open" : ""}`}>{t.optionScope[index].slice(0, reduced && index === 1 ? 3 : 4).map((item, itemIndex) => <span key={item}>{item.startsWith("ohne") || item.startsWith("without") ? <b className="minus">−</b> : <Check />}{item}</span>)}</div>
                </article>)}
              </div>
            </div>
            <div className="dots">{t.options.map((name, index) => <button key={name} className={option === index ? "active" : ""} onClick={() => setOption(index)} />)}</div>
            <div className="sticky-action offer-actions"><Button onClick={() => setScreen(9)}>{t.offerNext}</Button><button className="text-link" onClick={() => setScreen(8)}>{t.manual}</button></div>
          </>}

          {screen === 8 && <>
            <div className="intro compact"><h1>{t.priceTitle}</h1><p className="body">{t.clientBudget}</p></div>
            <div className="form-stack"><Field label={t.price} value="3.100" onChange={() => {}} suffix="€" /></div>
            <div className="amber-warning"><b>!</b><span>{t.warning}</span></div>
            <p className="warning-copy">{t.warningText}</p>
            <div className="equal-actions"><Button onClick={() => { setReduced(true); setServices((items) => items.slice(0, -1)); setOption(1); setScreen(7); }}>{t.reduce}</Button><Button secondary onClick={() => setScreen(9)}>{t.anyway}</Button></div>
            <button className="text-link centered-link" onClick={() => setScreen(7)}>{t.backOptions}</button>
          </>}

          {screen === 9 && <>
            <div className="intro compact"><h1>{t.prepareTitle}</h1></div>
            <div className="form-stack offer-form"><Field label={t.client} value={offer.client} onChange={(client) => setOffer({ ...offer, client })} /><Field label={t.project} value={offer.project} onChange={(project) => setOffer({ ...offer, project })} /><Field label={t.valid} type="date" value={offer.valid} onChange={(valid) => setOffer({ ...offer, valid })} /><Field label={t.message} value={offer.message} onChange={(message) => setOffer({ ...offer, message })} /></div>
            <div className="privacy-note"><span><Check /></span>{t.offerNote}</div>
            <div className="branding-row"><b>{t.branding}</b><button>{t.logo}</button><button><i />{t.color}</button></div>
            <div className="document-preview offer-preview"><div className="doc-top"><span className="brand-mark"><Spark /></span><span>ANGEBOT</span></div><strong>{offer.client}</strong>{t.options.map((name, index) => <p key={name}><span>{name}</span><b>{t.prices[index]}</b></p>)}</div>
            <div className="sticky-action"><Button onClick={() => setScreen(11)}>{t.next}</Button></div>
          </>}

          {screen === 11 && <>
            <div className="intro compact"><h1>{t.sendTitle}</h1></div>
            <div className="share-actions">
              <button onClick={download}><span><b>{t.pdf}</b><small>{t.file}</small></span><strong>PDF</strong></button>
              <button onClick={() => { navigator.clipboard?.writeText(`https://${t.share}`); setShareDone(t.link); setShareActions((items) => [...items, "link"]); }}><span><b>{t.link}</b><small>{t.share}</small></span><CopyIcon /></button>
              <button onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(t.prepareTitle)}&body=${encodeURIComponent(`https://${t.share}`)}`; setShareDone(t.mail); setShareActions((items) => [...items, "mail"]); }}><span><b>{t.mail}</b><small>{t.share}</small></span><strong>@</strong></button>
            </div>
            {shareDone && <div className="adjusted-banner"><Check /><span>{shareDone}</span></div>}
            <div className="info-row send-note"><span><Check /></span><p>{t.sendNote}</p></div>
            <div className="sticky-action"><Button onClick={() => setScreen(12)}>{t.done}</Button></div>
          </>}

          {screen === 12 && <>
            <div className="success-art"><span><Check /></span><i /><i /></div>
            <div className="intro success-intro"><p className="eyebrow">{t.ready} ✓</p>{early && <p className="body">{t.shortReady}</p>}</div>
            {!early && <div className="kit"><div className="kit-heading"><div><strong>{t.questions}</strong></div><Spark /></div>{t.situations.map((item, index) => <div className="kit-item" key={item}><button onClick={() => setReplyOpen(replyOpen === index ? null : index)}><span>{item}</span><Chevron up={replyOpen === index} /></button><div className={`kit-answer ${replyOpen === index ? "open" : ""}`}><p>{t.replies[index]} <button className="copy-button" onClick={() => navigator.clipboard?.writeText(t.replies[index])}><CopyIcon /></button></p></div></div>)}</div>}
            <div className="confidence-card"><b>{t.confidence}</b><div>{[1, 2, 3, 4, 5].map((value) => <button className={confidence === value ? "active" : ""} key={value} onClick={() => { setConfidence(value); setConfidenceChanged(true); }}>{value}</button>)}</div><Field label={t.unclear} value={unclear} onChange={setUnclear} /><div className="feedback-action">{feedbackStatus === "sent" ? <p className="feedback-status sent"><Check />{t.feedbackSent}</p> : <Button secondary disabled={feedbackStatus === "sending"} onClick={sendFeedback}>{feedbackStatus === "sending" ? t.sendingFeedback : t.sendFeedback}</Button>}{feedbackStatus === "error" && <p className="feedback-status">{t.feedbackError}</p>}</div></div>
            <div className="sticky-action static"><Button onClick={startNew}>{t.newOffer}</Button></div>
          </>}
        </div>
      </section>
    </main>
  );
}
