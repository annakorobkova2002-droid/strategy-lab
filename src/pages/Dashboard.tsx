import { useMemo } from "react";
import { useStore } from "../store";
import { content, studyLectures, lectureById } from "../data";
import { readiness, streak } from "../engine/readiness";
import { accuracy, masteryByLecture } from "../engine/mastery";
import { daysBetween, toDay } from "../engine/dates";
import { isDue } from "../engine/scheduler";
import { Bar, Stat, pct } from "../components/ui";

export function Dashboard() {
  const { progress: p, update } = useStore();
  const today = toDay();
  const ids = studyLectures.map((l) => l.id);
  const r = readiness(p, ids, today);
  const mastery = useMemo(() => masteryByLecture(p.attempts, ids), [p.attempts]);
  const completed = ids.filter((id) => p.lectures[id]?.completed).length;
  const todayAnswers = p.attempts.filter((a) => a.at.slice(0, 10) === today || toDay(new Date(a.at)) === today).length;
  const dueCards = content.flashcards.filter((c) => isDue(p.reviews[c.id], today)).length;
  const dueQuestions = content.questions.filter((q) => isDue(p.reviews[q.id], today)).length;
  const openMistakes = Object.values(p.mistakes).filter((m) => !m.resolved).length;
  const ranked = ids.filter((id) => mastery[id] !== null).sort((a, b) => (mastery[a]! - mastery[b]!));
  const weakest = ranked.slice(0, Math.min(3, Math.ceil(ranked.length / 2)));
  const strongest = ranked.slice(weakest.length).slice(-3).reverse();
  const nextLecture = studyLectures.find((l) => !p.lectures[l.id]?.completed);
  const daysLeft = p.settings.examDate ? daysBetween(today, p.settings.examDate) : null;

  let recommendation: { text: string; href: string };
  if (openMistakes >= 5) recommendation = { text: `Review your ${openMistakes} open mistakes`, href: "#/mistakes" };
  else if (dueQuestions + dueCards > 0) recommendation = { text: `Clear today's reviews: ${dueQuestions} questions, ${dueCards} flashcards`, href: dueQuestions ? "#/quiz?mode=review" : "#/flashcards" };
  else if (weakest.length && mastery[weakest[0]]! < 0.6) recommendation = { text: `Strengthen your weakest topic: ${lectureById[weakest[0]].code} ${lectureById[weakest[0]].title}`, href: `#/quiz?lecture=${weakest[0]}` };
  else if (nextLecture) recommendation = { text: `Study next: ${nextLecture.code} ${nextLecture.title}`, href: `#/lectures/${nextLecture.id}` };
  else recommendation = { text: "Run a mixed adaptive quiz", href: "#/quiz" };

  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Dashboard</p>
        <h1>Good to see you.</h1>
        <p className="lede">Your Business Strategy preparation at a glance.</p>
      </header>

      <section className="hero-card">
        <div>
          <div className="kicker">Recommended next session</div>
          <a className="hero-link" href={recommendation.href}>{recommendation.text} →</a>
        </div>
        <div className="countdown">
          {daysLeft === null ? (
            <label>
              <span>Exam date</span>
              <input type="date" value={p.settings.examDate} onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, examDate: e.target.value } }))} />
            </label>
          ) : (
            <a href="#/settings" title="Edit exam date">
              <b>{daysLeft >= 0 ? daysLeft : 0}</b>
              <span>{daysLeft === 1 ? "day" : "days"} to the exam</span>
            </a>
          )}
        </div>
      </section>

      <section className="stats">
        <Stat label="Exam readiness" value={`${r.score}`} hint="practice estimate · see breakdown" />
        <Stat label="Lectures completed" value={`${completed}/${ids.length}`} />
        <Stat label="Average accuracy" value={pct(accuracy(p.attempts))} hint={`${p.attempts.length} answers`} />
        <Stat label="Study streak" value={`${streak(p.studyDays, today)} d`} />
      </section>

      <div className="grid2">
        <section className="panel">
          <h2>Today</h2>
          <div className="goal">
            <div className="goal-row"><span>Daily questions</span><span>{todayAnswers}/{p.settings.dailyGoal}</span></div>
            <Bar value={todayAnswers / p.settings.dailyGoal} label="Daily question goal" />
          </div>
          <ul className="checklist">
            <li className={dueQuestions === 0 ? "done" : ""}>Due question reviews: {dueQuestions}</li>
            <li className={dueCards === 0 ? "done" : ""}>Due flashcards: {dueCards}</li>
            <li className={openMistakes === 0 ? "done" : ""}>Open mistakes: {openMistakes}</li>
          </ul>
        </section>

        <section className="panel">
          <h2>Readiness breakdown</h2>
          <p className="muted small">A transparent practice estimate, not a predicted grade.</p>
          {[
            ["Coverage (lectures completed)", r.coverage, "30%"],
            ["Mastery (on practised topics)", r.mastery, "40% × practised"],
            ["Topics practised", r.practised, "15%"],
            ["Study days in last 7", r.recency, "15%"],
          ].map(([label, v, w]) => (
            <div className="goal" key={label as string}>
              <div className="goal-row"><span>{label as string}</span><span className="muted">{pct(v as number)} · weight {w as string}</span></div>
              <Bar value={v as number} label={label as string} />
            </div>
          ))}
        </section>
      </div>

      <div className="grid2">
        <section className="panel">
          <h2>Weakest topics</h2>
          {weakest.length ? (
            <ul className="topic-list">
              {weakest.map((id) => (
                <li key={id}><a href={`#/quiz?lecture=${id}`}>{lectureById[id].code} {lectureById[id].title}</a><span>{pct(mastery[id])}</span></li>
              ))}
            </ul>
          ) : <p className="muted">Answer at least 3 questions in a lecture to see topic mastery.</p>}
        </section>
        <section className="panel">
          <h2>Strongest topics</h2>
          {strongest.length ? (
            <ul className="topic-list">
              {strongest.map((id) => (
                <li key={id}><a href={`#/lectures/${id}`}>{lectureById[id].code} {lectureById[id].title}</a><span>{pct(mastery[id])}</span></li>
              ))}
            </ul>
          ) : <p className="muted">No data yet.</p>}
        </section>
      </div>
    </div>
  );
}
