import type { Progress } from "../types";
import { daysBetween, toDay } from "./dates";
import { masteryByLecture } from "./mastery";

export interface ReadinessBreakdown {
  score: number; // 0–100
  coverage: number; // share of lectures marked complete
  mastery: number; // mean mastery over lectures with evidence (0 if none)
  practised: number; // share of lectures with enough quiz evidence
  recency: number; // share of the last 7 days with study activity
}

/**
 * Transparent practice estimate (NOT a predicted grade):
 *   score = 100 × (0.30 coverage + 0.40 mastery × practised + 0.15 practised + 0.15 recency)
 */
export function readiness(p: Progress, lectureIds: string[], today: string = toDay()): ReadinessBreakdown {
  const n = lectureIds.length || 1;
  const coverage = lectureIds.filter((id) => p.lectures[id]?.completed).length / n;
  const m = masteryByLecture(p.attempts, lectureIds);
  const known = Object.values(m).filter((x): x is number => x !== null);
  const mastery = known.length ? known.reduce((s, x) => s + x, 0) / known.length : 0;
  const practised = known.length / n;
  const recentDays = new Set(p.studyDays.filter((d) => daysBetween(d, today) >= 0 && daysBetween(d, today) < 7));
  const recency = recentDays.size / 7;
  const score = Math.round(100 * (0.3 * coverage + 0.4 * mastery * practised + 0.15 * practised + 0.15 * recency));
  return { score, coverage, mastery, practised, recency };
}

/** Consecutive study days ending today (or yesterday, so a streak isn't lost before you study today). */
export function streak(studyDays: string[], today: string = toDay()): number {
  const set = new Set(studyDays);
  let cursor = set.has(today) ? today : null;
  if (!cursor) {
    const [y, mo, d] = today.split("-").map(Number);
    const yd = new Date(y, mo - 1, d - 1);
    const yesterday = toDay(yd);
    if (!set.has(yesterday)) return 0;
    cursor = yesterday;
  }
  let count = 0;
  while (cursor && set.has(cursor)) {
    count++;
    const [y, mo, d] = cursor.split("-").map(Number);
    cursor = toDay(new Date(y, mo - 1, d - 1));
  }
  return count;
}
