import { useMemo, useState } from "react";
import { content, studyLectures, lectures } from "../data";
import { useStore } from "../store";
import { useRoute } from "../router";
import { buildSession } from "../engine/select";
import { recordAnswer } from "../storage";
import { QuestionCard } from "../components/QuestionCard";
import type { Question } from "../types";
import { isDue } from "../engine/scheduler";
import { toDay } from "../engine/dates";

interface RunnerProps {
  lectures?: string[];
  size: number;
  onlyMistakes?: boolean;
  onlyDue?: boolean;
}

/** Runs one adaptive learning-mode session and shows results at the end. */
export function QuizRunner({ lectures: ids, size, onlyMistakes, onlyDue }: RunnerProps) {
  const { progress, update } = useStore();
  const [seed, setSeed] = useState(0);
  const session = useMemo<Question[]>(() => {
    let pool = content.questions;
    if (onlyDue) pool = pool.filter((q) => isDue(progress.reviews[q.id], toDay()));
    return buildSession(pool, progress, { size, lectures: ids, onlyMistakes });
    // build once per run (seed changes on restart)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);
  const [i, setI] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);

  if (!session.length) {
    return <div className="empty"><h3>Nothing to practise here right now</h3><p>{onlyMistakes ? "You have no open mistakes. Well done." : onlyDue ? "No reviews are due today." : "No questions match this selection yet."}</p></div>;
  }

  if (i >= session.length) {
    const right = results.filter(Boolean).length;
    return (
      <div className="results">
        <div className="kicker">Session complete</div>
        <div className="score-big">{right}/{session.length}</div>
        <p>{Math.round((right / session.length) * 100)}% correct. Wrong answers were added to your mistake notebook and scheduled for review tomorrow.</p>
        <div className="row">
          <button className="btn primary" onClick={() => { setSeed(seed + 1); setI(0); setResults([]); }}>New session</button>
          <a className="btn" href="#/mistakes">Open mistake notebook</a>
        </div>
      </div>
    );
  }

  const q = session[i];
  return (
    <QuestionCard
      question={q}
      index={i}
      total={session.length}
      onAnswer={(chosen) => {
        update((p) => recordAnswer(p, q, chosen));
        setResults((r) => [...r, chosen === q.answer]);
      }}
      onNext={() => setI(i + 1)}
    />
  );
}

export function Quiz() {
  const { query } = useRoute();
  const preset = query.get("lecture");
  const mode = query.get("mode");
  const [lecture, setLecture] = useState(preset ?? "");
  const [size, setSize] = useState(10);
  const [running, setRunning] = useState<null | { ids?: string[]; due?: boolean }>(preset ? { ids: [preset] } : mode === "review" ? { due: true } : null);

  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Quiz · learning mode</p>
        <h1>Adaptive quiz</h1>
        <p className="lede">Questions are chosen by a rule-based engine: due reviews and mistakes first, then your weakest topics. Difficulty rises as your mastery improves.</p>
      </header>
      {!running ? (
        <section className="panel setup">
          <label>
            <span>Topic</span>
            <select value={lecture} onChange={(e) => setLecture(e.target.value)}>
              <option value="">Mixed — all lectures</option>
              {[...studyLectures, ...lectures.filter((l) => l.module === "H")].map((l) => (
                <option key={l.id} value={l.id}>{l.code} · {l.title} ({content.questions.filter((q) => q.lecture === l.id).length})</option>
              ))}
            </select>
          </label>
          <label>
            <span>Questions</span>
            <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
              {[5, 10, 20, 30].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <div className="row">
            <button className="btn primary" onClick={() => setRunning({ ids: lecture ? [lecture] : undefined })}>Start</button>
            <button className="btn" onClick={() => setRunning({ due: true })}>Due reviews only</button>
          </div>
          <p className="muted small kbd-hint">Shortcuts: press 1–4 to answer, Enter for the next question.</p>
        </section>
      ) : (
        <>
          <QuizRunner lectures={running.ids} size={size} onlyDue={running.due} />
          <button className="btn ghost" onClick={() => setRunning(null)}>← Change quiz settings</button>
        </>
      )}
    </div>
  );
}
