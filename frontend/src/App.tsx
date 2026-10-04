import { useEffect, useRef, useState } from "react";
import { screenName } from "./lib/screens";
import { texts } from "./lib/texts";
import type { Choices } from "./lib/tracking";
import { Intro, QuestionSheet, TaskBar, ThankYou } from "./study/StudyUI";
import { useStudy } from "./study/useStudy";

type Screen = 0 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 12;

const PRICES = [3000, 4200, 5600];
const REDUCED_PRICE = 3700;
const HOURS = [40, 51.8, 68.2];
const REDUCED_HOURS = 45;
const formatEuro = (value: number) => `${value.toLocaleString("de-DE")} €`;
const parseEuro = (value: string) => parseInt(value.replace(/\D/g, ""), 10) || 0;

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
function Field({ label, value, onChange, type = "text", placeholder = "", suffix = "", numeric = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; suffix?: string; numeric?: boolean }) {
  return <label className="field"><span>{label}</span><span className="input-wrap"><input type={type} inputMode={numeric ? "numeric" : undefined} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />{suffix && <b>{suffix}</b>}</span></label>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(0);
  const [early, setEarly] = useState(false);
  const [profession, setProfession] = useState(-1);
  const [project, setProject] = useState(-1);
  const [customProject, setCustomProject] = useState("");
  const [size, setSize] = useState(-1);
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
  const [price, setPrice] = useState("3.100");
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [offer, setOffer] = useState({ client: "Studio Nord", project: "Website", valid: "2025-06-30", message: "" });
  const [shareDone, setShareDone] = useState("");
  const [replyOpen, setReplyOpen] = useState<number | null>(0);
  const [whyOpened, setWhyOpened] = useState(false);
  const [scopeSkipped, setScopeSkipped] = useState(false);
  const [shareActions, setShareActions] = useState<string[]>([]);
  const touchStart = useRef(0);

  // The participant's choices, always stored with German labels so the CSV is the same for both languages.
  const de = texts.de;
  const rate = Math.round(68 * (60 / assumptions[0]) * ((100 + assumptions[1]) / 130) * ((100 + assumptions[2]) / 120));
  const optionPrice = (index: number) => (reduced && index === 1 ? REDUCED_PRICE : PRICES[index]);
  const floorFor = (index: number) => Math.round((rate * (reduced && index === 1 ? REDUCED_HOURS : HOURS[index])) / 10) * 10;
  const choices: Choices = {
    early,
    profession: de.professions[profession]?.[0] ?? null,
    project: de.projectTypes[profession]?.[project] ?? (customProject || null),
    size: de.sizes[size] ?? null,
    costsChecked: costChecked.map((index) => de.costs[index]),
    costValues: [...costValues],
    utilization: assumptions[0],
    taxReserve: assumptions[1],
    margin: assumptions[2],
    hourlyFloor: rate,
    whyOpened,
    services: services.map((index) => de.serviceItems[index]),
    revisions: de.revisionItems[revision],
    deadline,
    specifics: specifics.map((index) => de.specificItems[index]),
    scopeSkipped,
    option: de.options[option],
    reduced,
    customPrice,
    customPriceUnderFloor: customPrice !== null && customPrice < floorFor(option),
    offerClient: offer.client,
    offerProject: offer.project,
    offerValid: offer.valid,
    offerMessage: offer.message,
    shareActions,
  };
  const choicesRef = useRef(choices);
  choicesRef.current = choices;

  const study = useStudy(() => choicesRef.current);
  const t = texts[study.lang];

  useEffect(() => study.onScreen(screen, screenName(screen)), [screen]);

  const progress = ({ 2: 1, 4: 2, 5: 3, 6: 4, 7: 5 } as Record<number, number>)[screen];
  const projectOptions = t.projectTypes[profession] ?? [];
  const canEstimate = profession >= 0 && (project >= 0 || customProject.trim()) && size >= 0;
  const priceValue = parseEuro(price);
  const priceFloor = floorFor(option);
  const underFloor = priceValue > 0 && priceValue < priceFloor;

  const back = () => {
    const paths: Record<number, Screen> = { 2: 0, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 7, 11: 9, 12: 11 };
    setScreen(screen === 12 && early ? 3 : (paths[screen] ?? 0));
  };
  const toggle = (value: number, list: number[], setter: (next: number[]) => void) => setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  const startNew = () => {
    setEarly(false);
    setScreen(2);
  };
  const handleSwipe = (end: number) => {
    const delta = touchStart.current - end;
    if (Math.abs(delta) < 45) return;
    setOption((current) => delta > 0 ? Math.min(2, current + 1) : Math.max(0, current - 1));
  };
  const share = (action: string, label: string) => {
    setShareDone(label);
    setShareActions((items) => [...items, action]);
    study.logEvent("export", action);
  };
  const download = () => {
    const lines = t.options.map((name, index) => `${name} ${formatEuro(index === option && customPrice ? customPrice : optionPrice(index))}`);
    const file = new Blob([`FairRate ${t.docTitle}\n\n${lines.join("\n")}`], { type: "text/plain" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = t.file;
    anchor.click();
    URL.revokeObjectURL(url);
    share("pdf", t.pdf);
  };
  const chooseOffer = (next: Screen, via: string) => {
    study.logEvent("offerChosen", `${de.options[option]}/${via}`);
    setScreen(next);
  };
  const reduceScope = () => {
    setReduced(true);
    setServices((items) => items.slice(0, -1));
    setOption(1);
    setCustomPrice(null);
    setPrice("3.100");
    study.logEvent("warnPath", "reduce");
    setScreen(7);
  };
  const keepPrice = () => {
    setCustomPrice(priceValue || null);
    study.logEvent("warnPath", underFloor ? "anyway" : "aboveFloor");
    setScreen(9);
  };

  return (
    <main className={`app-shell ${study.phase === "task" ? "testing" : ""}`}>
      {study.phase === "task" && <TaskBar key={`task-${study.taskIndex}`} lang={study.lang} index={study.taskIndex} onDone={() => study.endTask("self")} onStuck={() => study.endTask("stuck")} />}

      {study.phase === "done" ? <ThankYou lang={study.lang} saveState={study.saveState} saveError={study.saveError()} onRetry={study.retry} /> : (
      <section className="phone" aria-label="FairRate — Mobile Prototype" onClickCapture={study.countClick}>
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
              <div className="result-preview">{t.options.map((name, index) => <div className={index === 1 ? "featured" : ""} key={name}><span>{name}</span><b>{formatEuro(PRICES[index])}</b><i /></div>)}</div>
            </section>
          </>}

          {screen === 2 && <>
            <div className="question-block"><h1>{t.professionTitle}</h1><div className="profession-grid">{t.professions.map(([name, sub], index) => <button key={name} disabled={index === 6} className={profession === index ? "selected" : ""} onClick={() => { setProfession(index); setProject(-1); }}><b>{name}</b>{sub && <span>{sub}</span>}</button>)}</div></div>
            {profession >= 0 && <div className="question-block"><h2>{t.projectTitle}</h2>{projectOptions.length ? <div className="choice-row">{projectOptions.map((item, index) => <button className={project === index ? "selected" : ""} key={item} onClick={() => setProject(index)}>{item}</button>)}</div> : <Field label={t.otherProject} value={customProject} onChange={setCustomProject} />}</div>}
            {(project >= 0 || customProject) && <div className="question-block"><h2>{t.sizeTitle}</h2><div className="chips compact-chips">{t.sizes.map((item, index) => <button className={size === index ? "selected" : ""} key={item} onClick={() => setSize(index)}><span>{size === index && <Check />}</span>{item}</button>)}</div></div>}
            <div className="sticky-action"><Button disabled={!canEstimate} onClick={() => setScreen(3)}>{t.estimateButton}</Button><small className="action-note">{t.noNumbers}</small></div>
          </>}

          {screen === 3 && <>
            <div className="intro"><span className="neutral-badge">{t.estimate}</span><h1 className="estimate-value">{t.estimateValue}</h1><p className="body">{t.standards}</p></div>
            <div className="empty-fields">{t.emptyFields.map((field) => <div key={field}><span>{field}</span><em>{t.empty}</em></div>)}</div>
            <div className="info-row"><span><Spark /></span><p>{t.estimateExplain}</p></div>
            <div className="sticky-action double-action"><Button onClick={() => setScreen(4)}>{t.refine}</Button><Button secondary onClick={() => { setEarly(true); study.logEvent("earlyExit"); setScreen(12); }}>{t.enough}</Button></div>
          </>}

          {screen === 4 && <>
            <div className="intro compact"><h1>{t.costsTitle}</h1><p className="body">{t.costsSub}</p></div>
            <div className="cost-list">{t.costs.map((cost, index) => <div className={index === 2 ? "current" : ""} key={cost}><button className={`cost-check ${costChecked.includes(index) ? "checked" : ""}`} onClick={() => toggle(index, costChecked, setCostChecked)}>{costChecked.includes(index) && <Check />}</button><span>{cost}</span><label><input value={costValues[index]} onChange={(event) => { const values = [...costValues]; values[index] = event.target.value; setCostValues(values); }} /><b>€</b></label>{index === 2 && <p>{t.aiTip}</p>}</div>)}</div>
            <div className="privacy-note"><span><Check /></span>{t.privateNote}</div>
            <div className="sticky-action"><Button onClick={() => setScreen(5)}>{t.calculate}</Button></div>
          </>}

          {screen === 5 && <>
            <div className="intro floor-intro"><p className="eyebrow">{t.floorLabel}</p><h1>{rate} €/h</h1><p className="body">{t.floorSub}</p></div>
            <div className="minimum-card">
              <button className="expander" onClick={() => { if (!whyOpen) study.logEvent("whyOpened"); setWhyOpen(!whyOpen); setWhyOpened(true); }}><span>{t.why}</span><Chevron up={whyOpen} /></button>
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
            <button className="text-link left-link" onClick={() => { setScopeSkipped(true); study.logEvent("scopeSkipped"); setScreen(7); }}>{t.skip}</button><small className="skip-note">{t.skipNote}</small>
            <div className="sticky-action"><Button onClick={() => { setScopeSkipped(false); study.logEvent("scopeDone", services.length); setScreen(7); }}>{t.create}</Button></div>
          </>}

          {screen === 7 && <>
            <div className="intro compact offers-intro"><h1>{t.offersTitle}</h1><p className="body">{t.offersSub}</p></div>
            {reduced && <div className="adjusted-banner"><Check /><span>{t.adjustedScope}</span></div>}
            <div className="offer-viewport" onTouchStart={(event) => touchStart.current = event.touches[0].clientX} onTouchEnd={(event) => handleSwipe(event.changedTouches[0].clientX)}>
              <div className="offer-track" style={{ transform: `translateX(calc(${option * -100}% - ${option * 12}px))` }}>
                {t.options.map((name, index) => <article className={`offer-card ${index === 1 ? "recommended" : ""}`} key={name}>
                  {index === 1 && <span className="recommend-label">{t.options[1]}</span>}
                  <div className="offer-head"><span><b>{name}</b><small>{index === 1 ? t.offersSub : `Option ${index + 1}`}</small></span><i>{index + 1}</i></div>
                  <strong className="offer-price">{formatEuro(optionPrice(index))}</strong>
                  <button className="scope-toggle" onClick={() => setOpenOption(openOption === index ? null : index)}>{openOption === index ? t.close : t.included}<Chevron up={openOption === index} /></button>
                  <div className={`offer-scope ${openOption === index ? "open" : ""}`}>{t.optionScope[index].slice(0, reduced && index === 1 ? 3 : 4).map((item) => <span key={item}>{item.startsWith(t.excluded) ? <b className="minus">−</b> : <Check />}{item}</span>)}</div>
                </article>)}
              </div>
            </div>
            <div className="dots">{t.options.map((name, index) => <button key={name} className={option === index ? "active" : ""} onClick={() => setOption(index)} />)}</div>
            <div className="sticky-action offer-actions"><Button onClick={() => chooseOffer(9, "next")}>{t.offerNext}</Button><button className="text-link" onClick={() => chooseOffer(8, "manual")}>{t.manual}</button></div>
          </>}

          {screen === 8 && <>
            <div className="intro compact"><h1>{t.priceTitle}</h1><p className="body">{t.clientBudget}</p></div>
            <div className="form-stack"><Field label={`${t.yourOffer} · ${t.options[option]}`} value={price} onChange={setPrice} suffix="€" numeric /></div>
            <p className="warning-copy">{t.floorForScope} <b>{formatEuro(priceFloor)}</b></p>
            {underFloor ? <>
              <div className="amber-warning"><b>!</b><span>{t.belowFloor.replace("{p}", String(Math.round((1 - priceValue / priceFloor) * 100)))}</span></div>
              <p className="warning-copy">{t.warningText}</p>
              <div className="equal-actions"><Button onClick={reduceScope}>{t.reduce}</Button><Button secondary onClick={keepPrice}>{t.anyway}</Button></div>
            </> : <>
              <div className="adjusted-banner"><Check /><span>{t.aboveFloor}</span></div>
              <div className="equal-actions single"><Button disabled={!priceValue} onClick={keepPrice}>{t.continuePrice}</Button></div>
            </>}
            <button className="text-link centered-link" onClick={() => setScreen(7)}>{t.backOptions}</button>
          </>}

          {screen === 9 && <>
            <div className="intro compact"><h1>{t.prepareTitle}</h1></div>
            <div className="form-stack offer-form"><Field label={t.client} value={offer.client} onChange={(client) => setOffer({ ...offer, client })} /><Field label={t.project} value={offer.project} onChange={(project) => setOffer({ ...offer, project })} /><Field label={t.valid} type="date" value={offer.valid} onChange={(valid) => setOffer({ ...offer, valid })} /><Field label={t.message} value={offer.message} onChange={(message) => setOffer({ ...offer, message })} /></div>
            <div className="privacy-note"><span><Check /></span>{t.offerNote}</div>
            <div className="branding-row"><b>{t.branding}</b><button>{t.logo}</button><button><i />{t.color}</button></div>
            <div className="document-preview offer-preview"><div className="doc-top"><span className="brand-mark"><Spark /></span><span>{t.docTitle}</span></div><strong>{offer.client}</strong>{t.options.map((name, index) => <p key={name}><span>{name}</span><b>{formatEuro(index === option && customPrice ? customPrice : optionPrice(index))}</b></p>)}</div>
            <div className="sticky-action"><Button onClick={() => setScreen(11)}>{t.next}</Button></div>
          </>}

          {screen === 11 && <>
            <div className="intro compact"><h1>{t.sendTitle}</h1></div>
            <div className="share-actions">
              <button onClick={download}><span><b>{t.pdf}</b><small>{t.file}</small></span><strong>PDF</strong></button>
              <button onClick={() => { navigator.clipboard?.writeText(`https://${t.share}`); share("link", t.link); }}><span><b>{t.link}</b><small>{t.share}</small></span><CopyIcon /></button>
              <button onClick={() => { share("mail", t.mail); window.location.href = `mailto:?subject=${encodeURIComponent(t.prepareTitle)}&body=${encodeURIComponent(`https://${t.share}`)}`; }}><span><b>{t.mail}</b><small>{t.share}</small></span><strong>@</strong></button>
            </div>
            {shareDone && <div className="adjusted-banner"><Check /><span>{shareDone}</span></div>}
            <div className="info-row send-note"><span><Check /></span><p>{t.sendNote}</p></div>
            <div className="sticky-action"><Button onClick={() => setScreen(12)}>{t.done}</Button></div>
          </>}

          {screen === 12 && <>
            <div className="success-art"><span><Check /></span><i /><i /></div>
            <div className="intro success-intro"><p className="eyebrow">{t.ready} ✓</p>{early && <p className="body">{t.shortReady}</p>}</div>
            {!early && <div className="kit"><div className="kit-heading"><div><strong>{t.questions}</strong></div><Spark /></div>{t.situations.map((item, index) => <div className="kit-item" key={item}><button onClick={() => { if (replyOpen !== index) study.logEvent("kitOpened", index + 1); setReplyOpen(replyOpen === index ? null : index); }}><span>{item}</span><Chevron up={replyOpen === index} /></button><div className={`kit-answer ${replyOpen === index ? "open" : ""}`}><p>{t.replies[index]} <button className="copy-button" onClick={() => navigator.clipboard?.writeText(t.replies[index])}><CopyIcon /></button></p></div></div>)}</div>}
            <div className="sticky-action static"><Button onClick={startNew}>{t.newOffer}</Button></div>
          </>}
        </div>
      </section>
      )}

      {study.phase === "intro" && <Intro lang={study.lang} setLang={study.setLang} onStart={() => study.start(screenName(screen))} />}
      {study.sheet && <QuestionSheet key={`sheet-${study.sheet.id}`} lang={study.lang} questions={study.sheet.questions} onDone={study.sheet.onDone} />}
    </main>
  );
}
