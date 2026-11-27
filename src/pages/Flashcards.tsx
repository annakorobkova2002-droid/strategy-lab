import { useMemo, useState } from "react";
import type { Flashcard, Rating } from "../types";
import { content, lectureLabel, studyLectures } from "../data";
import { useStore } from "../store";
import { recordCard } from "../storage";
import { isDue } from "../engine/scheduler";
import { toDay } from "../engine/dates";
import { shuffle } from "../engine/shuffle";
import { LADDER } from "../engine/scheduler";

const RATINGS: { r: Rating; label: string; hint: string }[] = [
  { r: "again", label: "Again", hint: "tomorrow" },
  { r: "hard", label: "Hard", hint: "same interval" },
  { r: "good", label: "Good", hint: "next step" },
  { r: "easy", label: "Easy", hint: "skip a step" },
];

export function CardDeck({ cards, title }: { cards: Flashcard[]; title: string }) {
  const { progress, update } = useStore();
  const today = toDay();
  const [deck, setDeck] = useState(() => {
    const due = cards.filter((c) => isDue(progress.reviews[c.id], today));
    const fresh = cards.filter((c) => !progress.reviews[c.id]);
    return [...shuffle(due), ...shuffle(fresh)];
  });
  const [flipped, setFlipped] = useState(false);
  const card = deck[0];

  if (!cards.length) return <p className="muted">No flashcards for this selection.</p>;
  if (!card) {
    const nextDue = cards.map((c) => progress.reviews[c.id]?.due).filter(Boolean).sort()[0];
    return <div className="empty"><h3>All caught up</h3><p>No cards are due in “{title}”.{nextDue ? ` Next review: ${nextDue}.` : ""}</p><button className="btn" onClick={() => setDeck(shuffle(cards))}>Practise all anyway</button></div>;
  }

  const rate = (r: Rating) => {
    update((p) => recordCard(p, card.id, r));
    setFlipped(false);
    setDeck((d) => (r === "again" ? [...d.slice(1), d[0]] : d.slice(1)));
  };
  const step = progress.reviews[card.id]?.step ?? -1;

  return (
    <div className="deck">
      <div className="muted small">{deck.length} card{deck.length === 1 ? "" : "s"} left · {lectureLabel(card.lecture)}</div>
      <button className={`flash ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)} aria-label={flipped ? "Show term" : "Show definition"}>
        {!flipped ? (
          <><span className="kicker">Term</span><span className="flash-front">{card.front}</span><span className="muted small">Click or press Space to reveal</span></>
        ) : (
          <><span className="kicker">{card.front}</span><span className="flash-back">{card.back}</span></>
        )}
      </button>
      {flipped && (
        <div className="ratings">
          {RATINGS.map(({ r, label, hint }) => {
            const s = r === "again" ? 0 : r === "hard" ? Math.max(0, step) : r === "good" ? Math.min(4, step + 1) : Math.min(4, step + 2);
            return (
              <button key={r} className={`rate rate-${r}`} onClick={() => rate(r)}>
                <b>{label}</b><small>{LADDER[s]} d · {hint}</small>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Flashcards() {
  const [lecture, setLecture] = useState("");
  const cards = useMemo(() => (lecture ? content.flashcards.filter((c) => c.lecture === lecture) : content.flashcards), [lecture]);
  const { progress } = useStore();
  const due = content.flashcards.filter((c) => isDue(progress.reviews[c.id], toDay())).length;
  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Flashcards</p>
        <h1>Spaced-repetition flashcards</h1>
        <p className="lede">{content.flashcards.length} cards built from every lecture's key definitions · {due} due today. Rate each card; reviews come back after 1, 3, 7, 14 or 30 days.</p>
      </header>
      <div className="toolbar">
        <select value={lecture} onChange={(e) => setLecture(e.target.value)} aria-label="Choose deck">
          <option value="">All lectures</option>
          {studyLectures.map((l) => <option key={l.id} value={l.id}>{l.code} · {l.title}</option>)}
        </select>
      </div>
      <CardDeck key={lecture} cards={cards} title={lecture ? lectureLabel(lecture) : "All lectures"} />
    </div>
  );
}
