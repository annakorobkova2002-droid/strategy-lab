import { useEffect, useMemo, useState } from "react";
import type { Question } from "../types";
import { presentOptions } from "../engine/select";
import { lectureLabel } from "../data";

const DIFF = { 1: "Foundational", 2: "Intermediate", 3: "Advanced" } as const;

interface Props {
  question: Question;
  index: number;
  total: number;
  onAnswer: (chosen: string) => void;
  onNext: () => void;
}

/** One question at a time, immediate feedback (learning mode), keyboard: 1–4 to answer, Enter to continue. */
export function QuestionCard({ question: q, index, total, onAnswer, onNext }: Props) {
  const options = useMemo(() => presentOptions(q), [q]);
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => setChosen(null), [q.id]);

  const choose = (id: string) => {
    if (chosen) return;
    setChosen(id);
    onAnswer(id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const n = Number(e.key);
      if (!chosen && n >= 1 && n <= options.length) choose(options[n - 1].id);
      else if (chosen && e.key === "Enter") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const correct = chosen === q.answer;
  return (
    <article className="qcard" aria-live="polite">
      <div className="qmeta">
        <span>Question {index + 1} of {total}</span>
        <span className={`chip d${q.difficulty}`}>{DIFF[q.difficulty]}</span>
        <span className="muted">{lectureLabel(q.lecture)}</span>
      </div>
      <h2 className="qstem">{q.stem}</h2>
      <div className="options" role="group" aria-label="Answer options">
        {options.map((o, i) => {
          const state = !chosen ? "" : o.id === q.answer ? "is-correct" : o.id === chosen ? "is-wrong" : "is-dim";
          return (
            <button key={o.id} className={`option ${state}`} onClick={() => choose(o.id)} disabled={!!chosen} aria-pressed={chosen === o.id}>
              <span className="option-key">{i + 1}</span>
              <span className="option-text">{o.text}</span>
            </button>
          );
        })}
      </div>
      {chosen && (
        <div className={`feedback ${correct ? "ok" : "ko"}`}>
          <div className="feedback-title">{correct ? "Correct" : "Not quite"}</div>
          <p>{q.explanation}</p>
          {options.some((o) => o.why) && (
            <ul className="whys">
              {options.filter((o) => o.id !== q.answer && o.why).map((o) => (
                <li key={o.id}><strong>{o.text}:</strong> {o.why}</li>
              ))}
            </ul>
          )}
          {q.source && <div className="source">Source: {q.source}</div>}
          <button className="btn primary" onClick={onNext} autoFocus>
            {index + 1 < total ? "Next question" : "See results"} <span className="kbd">Enter</span>
          </button>
        </div>
      )}
    </article>
  );
}
