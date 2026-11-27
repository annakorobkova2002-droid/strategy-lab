import type { Progress, Question } from "../types";
import { toDay } from "./dates";
import { masteryByLecture } from "./mastery";
import { isDue, isMastered } from "./scheduler";
import { shuffle } from "./shuffle";

/** Highest difficulty unlocked for a topic, based on demonstrated mastery. */
export function unlockedDifficulty(mastery: number | null): 1 | 2 | 3 {
  if (mastery === null) return 2; // no evidence yet: foundational + intermediate
  if (mastery < 0.6) return 1; // struggling: consolidate the foundations first
  if (mastery < 0.8) return 2;
  return 3; // strong: unlock advanced questions
}

export interface SessionOptions {
  size: number;
  lectures?: string[]; // restrict to these lectures
  onlyMistakes?: boolean;
  random?: () => number;
  today?: string;
}

/**
 * Builds an adaptive quiz session:
 *  1. due reviews (spaced repetition) and unresolved mistakes first
 *  2. then unseen questions from the weakest topics, within the unlocked difficulty
 *  3. then any remaining unseen questions; mastered items are left out unless needed to fill
 */
export function buildSession(all: Question[], p: Progress, opts: SessionOptions): Question[] {
  const today = opts.today ?? toDay();
  const random = opts.random ?? Math.random;
  let pool = opts.lectures?.length ? all.filter((q) => opts.lectures!.includes(q.lecture)) : all;
  if (opts.onlyMistakes) {
    pool = pool.filter((q) => p.mistakes[q.id] && !p.mistakes[q.id].resolved);
    return shuffle(pool, random).slice(0, opts.size);
  }
  const lectureIds = [...new Set(pool.map((q) => q.lecture))];
  const mastery = masteryByLecture(p.attempts, lectureIds);

  const due = pool.filter((q) => isDue(p.reviews[q.id], today) || (p.mistakes[q.id] && !p.mistakes[q.id].resolved));
  const unseen = pool.filter((q) => !p.reviews[q.id]);
  const weakness = (q: Question) => mastery[q.lecture] ?? 0.5; // unknown topics count as mid-weak
  const fitsLevel = (q: Question) => q.difficulty <= unlockedDifficulty(mastery[q.lecture]);

  const ordered = [
    ...shuffle(due, random),
    ...shuffle(unseen.filter(fitsLevel), random).sort((a, b) => weakness(a) - weakness(b)),
    ...shuffle(unseen.filter((q) => !fitsLevel(q)), random),
    ...shuffle(pool.filter((q) => p.reviews[q.id] && !isDue(p.reviews[q.id], today) && !isMastered(p.reviews[q.id])), random),
    ...shuffle(pool.filter((q) => isMastered(p.reviews[q.id])), random),
  ];
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const q of ordered) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    out.push(q);
    if (out.length >= opts.size) break;
  }
  return out;
}

/** Shuffles answer positions for MCQs; true/false keeps its natural order. */
export function presentOptions(q: Question, random: () => number = Math.random) {
  return q.type === "mcq" ? shuffle(q.options, random) : q.options;
}
