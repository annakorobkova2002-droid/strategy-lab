import { useState } from "react";
import { content, lectureById, lectureLabel } from "../data";
import { useStore } from "../store";
import { QuizRunner } from "./Quiz";

const qById = Object.fromEntries(content.questions.map((q) => [q.id, q]));

export function Mistakes() {
  const { progress: p } = useStore();
  const [filter, setFilter] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [practising, setPractising] = useState(false);
  const all = Object.values(p.mistakes).filter((m) => qById[m.questionId]);
  const list = all
    .filter((m) => (showResolved || !m.resolved) && (!filter || m.lecture === filter))
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  const lecturesWithMistakes = [...new Set(all.map((m) => m.lecture))];

  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Mistake notebook</p>
        <h1>Your mistakes</h1>
        <p className="lede">Every wrong answer is saved here automatically. Answering it correctly later marks it as resolved.</p>
      </header>
      {practising ? (
        <>
          <QuizRunner onlyMistakes lectures={filter ? [filter] : undefined} size={20} />
          <button className="btn ghost" onClick={() => setPractising(false)}>← Back to the notebook</button>
        </>
      ) : (
        <>
          <div className="toolbar">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by lecture">
              <option value="">All topics</option>
              {lecturesWithMistakes.map((id) => <option key={id} value={id}>{lectureLabel(id)}</option>)}
            </select>
            <label className="check"><input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} /> Show resolved</label>
            <button className="btn primary" disabled={!list.some((m) => !m.resolved)} onClick={() => setPractising(true)}>Repeat only my mistakes</button>
          </div>
          {!list.length && <div className="empty"><h3>No mistakes to show</h3><p>Wrong quiz answers will appear here.</p></div>}
          <div className="mistakes">
            {list.map((m) => {
              const q = qById[m.questionId];
              const opt = (id: string) => q.options.find((o) => o.id === id)?.text ?? id;
              const review = p.reviews[m.questionId];
              return (
                <article key={m.questionId} className={`mistake ${m.resolved ? "resolved" : ""}`}>
                  <div className="qmeta"><span>{lectureById[q.lecture]?.code}</span><span>Missed {m.count}×</span><span>{m.resolved ? "Mastered since" : `Next review ${review?.due ?? "—"}`}</span></div>
                  <h3>{q.stem}</h3>
                  <p><span className="tag ko">Your answer</span> {opt(m.lastChosen)}</p>
                  <p><span className="tag ok">Correct</span> {opt(q.answer)}</p>
                  <p className="muted">{q.explanation}</p>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
