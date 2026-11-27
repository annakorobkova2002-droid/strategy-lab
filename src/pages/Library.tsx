import { useMemo, useState } from "react";
import { lectures, MODULES, content } from "../data";
import { useStore } from "../store";
import { masteryByLecture } from "../engine/mastery";
import { pct } from "../components/ui";

const strip = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

export function Library() {
  const { progress: p } = useStore();
  const [q, setQ] = useState("");
  const [module, setModule] = useState("");
  const mastery = useMemo(() => masteryByLecture(p.attempts, lectures.map((l) => l.id)), [p.attempts]);
  const index = useMemo(
    () => Object.fromEntries(lectures.map((l) => [l.id, (l.code + " " + l.title + " " + l.sections.map((s) => s.heading + " " + strip(s.html)).join(" ")).toLowerCase()])),
    [],
  );
  const needle = q.trim().toLowerCase();
  const shown = lectures.filter((l) => (!module || l.module === module) && (!needle || index[l.id].includes(needle)));
  const groups = Object.keys(MODULES).filter((m) => shown.some((l) => l.module === m));

  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Lecture library</p>
        <h1>All lectures</h1>
        <p className="lede">Complete notes, summaries, key definitions, flashcards and quizzes for every session.</p>
      </header>
      <div className="toolbar">
        <input type="search" placeholder="Search all notes (e.g. VRIO, CAGE, mission drift)…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search lectures" />
        <select value={module} onChange={(e) => setModule(e.target.value)} aria-label="Filter by module">
          <option value="">All modules</option>
          {Object.entries(MODULES).map(([k, v]) => <option key={k} value={k}>{k === "H" ? v : `Module ${k} · ${v}`}</option>)}
        </select>
      </div>
      {groups.map((m) => (
        <section key={m} className="module">
          <h2 className="module-title">{m === "H" ? MODULES[m] : `Module ${m} · ${MODULES[m]}`}</h2>
          <div className="cards">
            {shown.filter((l) => l.module === m).map((l) => {
              const lp = p.lectures[l.id];
              const nq = content.questions.filter((x) => x.lecture === l.id).length;
              return (
                <a key={l.id} className="lcard" href={`#/lectures/${l.id}`}>
                  <div className="lcard-code">{l.code}</div>
                  <div className="lcard-title">{l.title}</div>
                  <div className="lcard-meta">
                    <span>{Math.max(1, Math.round(l.wordCount / 220))} min read</span>
                    <span>{nq} questions</span>
                    <span>{l.definitions.length} cards</span>
                  </div>
                  <div className="lcard-foot">
                    {lp?.completed ? <span className="chip ok">Completed</span> : <span className="chip">Not completed</span>}
                    {mastery[l.id] !== null && <span className="chip">Mastery {pct(mastery[l.id])}</span>}
                    {lp?.confidence ? <span className="chip">Confidence {lp.confidence}/5</span> : null}
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ))}
      {!shown.length && <p className="muted">No lecture matches “{q}”.</p>}
    </div>
  );
}
