import type { Attempt, Progress, Question, Rating } from "./types";
import { toDay } from "./engine/dates";
import { ratingFromAnswer, review } from "./engine/scheduler";

export const STORAGE_KEY = "strategy-lab:v1";

export function emptyProgress(): Progress {
  return {
    version: 1,
    settings: { examDate: "", theme: "system", dailyGoal: 20 },
    lectures: {},
    reviews: {},
    attempts: [],
    mistakes: {},
    studyDays: [],
  };
}

/** Validates and upgrades any stored/imported object into a safe Progress value. */
export function migrate(raw: unknown): Progress {
  const base = emptyProgress();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<Progress>;
  if (r.version !== undefined && r.version !== 1) throw new Error(`Unsupported progress version: ${String(r.version)}`);
  return {
    version: 1,
    settings: { ...base.settings, ...(r.settings ?? {}) },
    lectures: r.lectures && typeof r.lectures === "object" ? r.lectures : {},
    reviews: r.reviews && typeof r.reviews === "object" ? r.reviews : {},
    attempts: Array.isArray(r.attempts) ? r.attempts.filter((a) => a && typeof a.questionId === "string") : [],
    mistakes: r.mistakes && typeof r.mistakes === "object" ? r.mistakes : {},
    studyDays: Array.isArray(r.studyDays) ? [...new Set(r.studyDays.filter((d) => typeof d === "string"))] : [],
  };
}

export function load(storage: Pick<Storage, "getItem"> = localStorage): Progress {
  try {
    const text = storage.getItem(STORAGE_KEY);
    return text ? migrate(JSON.parse(text)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function save(p: Progress, storage: Pick<Storage, "setItem"> = localStorage): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false; // quota exceeded or storage disabled — app keeps working in memory
  }
}

export function exportJson(p: Progress): string {
  return JSON.stringify({ app: "strategy-lab", exportedAt: new Date().toISOString(), progress: p }, null, 2);
}

export function importJson(text: string): Progress {
  const parsed = JSON.parse(text);
  const payload = parsed && parsed.app === "strategy-lab" ? parsed.progress : parsed;
  return migrate(payload);
}

function markStudied(p: Progress, today: string): string[] {
  return p.studyDays.includes(today) ? p.studyDays : [...p.studyDays, today];
}

/** Records a quiz answer: attempt log, spaced-repetition state, mistake notebook, study day. */
export function recordAnswer(p: Progress, q: Question, chosen: string, now: Date = new Date()): Progress {
  const today = toDay(now);
  const correct = chosen === q.answer;
  const attempt: Attempt = { questionId: q.id, lecture: q.lecture, correct, chosen, difficulty: q.difficulty, at: now.toISOString() };
  const prevMistake = p.mistakes[q.id];
  const mistakes = { ...p.mistakes };
  if (!correct) {
    mistakes[q.id] = {
      questionId: q.id,
      lecture: q.lecture,
      count: (prevMistake?.count ?? 0) + 1,
      lastChosen: chosen,
      lastAt: now.toISOString(),
      resolved: false,
    };
  } else if (prevMistake && !prevMistake.resolved) {
    mistakes[q.id] = { ...prevMistake, resolved: true };
  }
  return {
    ...p,
    attempts: [...p.attempts, attempt],
    reviews: { ...p.reviews, [q.id]: review(p.reviews[q.id], ratingFromAnswer(correct), today) },
    mistakes,
    studyDays: markStudied(p, today),
  };
}

/** Records a flashcard self-assessment. */
export function recordCard(p: Progress, cardId: string, rating: Rating, now: Date = new Date()): Progress {
  const today = toDay(now);
  return {
    ...p,
    reviews: { ...p.reviews, [cardId]: review(p.reviews[cardId], rating, today) },
    studyDays: markStudied(p, today),
  };
}
