import { useEffect, useMemo, useState } from "react";
import { lectureById, content, MODULES, lectures } from "../data";
import { useStore } from "../store";
import { toDay } from "../engine/dates";
import { calibration, topicMastery } from "../engine/mastery";
import { pct } from "../components/ui";
import { CardDeck } from "./Flashcards";
import { QuizRunner } from "./Quiz";

const TABS = ["Notes", "Summary", "Definitions", "Flashcards", "Quiz"] as const;
type Tab = (typeof TABS)[number];

const CAL_TEXT = {
  overconfident: "Your confidence is higher than your quiz results — practise more here.",
  underconfident: "You know this better than you think.",
  calibrated: "Your confidence matches your results.",
  unknown: "Rate your confidence and answer a few questions to compare.",
};

export function LectureView({ id }: { id: string }) {
  const l = lectureById[id];
  const { progress: p, update } = useStore();
  const [tab, setTab] = useState<Tab>("Notes");
  useEffect(() => setTab("Notes"), [id]);
  useEffect(() => {
    if (l) update((s) => ({ ...s, lectures: { ...s.lectures, [id]: { ...(s.lectures[id] ?? { completed: false, confidence: 0 }), lastOpened: toDay() } } }));
  }, [id]);
  const questions = useMemo(() => content.questions.filter((q) => q.lecture === id), [id]);
  const cards = useMemo(() => content.flashcards.filter((c) => c.lecture === id), [id]);

  if (!l) return <div className="page"><h1>Lecture not found</h1><a href="#/lectures">Back to the library</a></div>;
  const lp = p.lectures[id] ?? { completed: false, confidence: 0 };
  const mastery = topicMastery(p.attempts.filter((a) => a.lecture === id));
  const setLp = (patch: Partial<typeof lp>) => update((s) => ({ ...s, lectures: { ...s.lectures, [id]: { ...lp, ...patch } } }));
  const idx = lectures.findIndex((x) => x.id === id);
  const prev = lectures[idx - 1];
  const next = lectures[idx + 1];

  return (
    <div className="page lecture">
      <a className="back" href="#/lectures">← Library</a>
      <header className="lec-head">
        <p className="kicker">{l.module === "H" ? MODULES.H : `Module ${l.module} · ${MODULES[l.module]}`}</p>
        <div className="lec-code">{l.code}</div>
        <h1>{l.title}</h1>
        {l.readings && <p className="muted">Reading · {l.readings}</p>}
      </header>

      <section className="lec-status">
        <label className="check">
          <input type="checkbox" checked={lp.completed} onChange={(e) => setLp({ completed: e.target.checked })} />
          Mark as completed
        </label>
        <div className="confidence" role="radiogroup" aria-label="Confidence rating">
          <span>Confidence</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} role="radio" aria-checked={lp.confidence === n} className={lp.confidence >= n ? "on" : ""} onClick={() => setLp({ confidence: n })}>{n}</button>
          ))}
        </div>
        <div className="muted small">Mastery {pct(mastery)} · {CAL_TEXT[calibration(lp.confidence, mastery)]}</div>
      </section>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
            {t === "Quiz" && <span className="count">{questions.length}</span>}
            {t === "Flashcards" && <span className="count">{cards.length}</span>}
          </button>
        ))}
      </div>

      {tab === "Notes" && (
        <div className="notes">
          <nav className="toc" aria-label="On this page">
            {l.sections.map((s) => <a key={s.id} href={`#/lectures/${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: "smooth" }); }}>{s.heading}</a>)}
          </nav>
          <div className="prose">
            {l.sections.map((s) => (
              <section key={s.id} id={`sec-${s.id}`} className={`sec sec-${s.kind}`}>
                <h2>{s.heading}</h2>
                <div dangerouslySetInnerHTML={{ __html: s.html }} />
              </section>
            ))}
          </div>
        </div>
      )}

      {tab === "Summary" && (
        <div className="memo-card">
          <div className="kicker">Condensed summary</div>
          {l.summary.length ? <ul>{l.summary.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p>No summary yet.</p>}
        </div>
      )}

      {tab === "Definitions" && (
        l.definitions.length ? (
          <dl className="defs">
            {l.definitions.map((d) => (<div key={d.term}><dt>{d.term}</dt><dd>{d.definition}</dd></div>))}
          </dl>
        ) : <p className="muted">This chapter has no definitions table.</p>
      )}

      {tab === "Flashcards" && <CardDeck cards={cards} title={`${l.code} flashcards`} />}
      {tab === "Quiz" && (questions.length ? <QuizRunner key={id} lectures={[id]} size={Math.min(10, questions.length)} /> : <p className="muted">Questions for this lecture are coming in the next content release.</p>)}

      <nav className="pager">
        {prev ? <a href={`#/lectures/${prev.id}`}>← {prev.code} {prev.title}</a> : <span />}
        {next ? <a href={`#/lectures/${next.id}`}>{next.code} {next.title} →</a> : <span />}
      </nav>
    </div>
  );
}
