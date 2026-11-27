import { useState } from "react";
import { content } from "../data";

export function Glossary() {
  const [q, setQ] = useState("");
  const n = q.trim().toLowerCase();
  const entries = content.glossary.filter((g) => !n || g.term.toLowerCase().includes(n) || g.definition.toLowerCase().includes(n));
  const letters = [...new Set(entries.map((e) => e.term[0].toUpperCase()))];
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Academic glossary</p>
        <h1>Glossary</h1>
        <p className="lede">{content.glossary.length} terms from all lectures, each linked to its chapter.</p>
      </header>
      <div className="toolbar"><input type="search" placeholder="Search terms or definitions…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search glossary" /></div>
      {letters.map((L) => (
        <section key={L} className="gloss-group">
          <h2 className="letter">{L}</h2>
          <dl className="defs">
            {entries.filter((e) => e.term[0].toUpperCase() === L).map((e) => (
              <div key={e.term + e.lecture}>
                <dt>{e.term} <a className="chip" href={`#/lectures/${e.lecture}`}>{e.lectureCode}</a></dt>
                <dd>{e.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      {!entries.length && <p className="muted">No term matches “{q}”.</p>}
    </div>
  );
}
