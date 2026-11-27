import type { Attempt } from "../types";

const DIFFICULTY_WEIGHT = { 1: 1, 2: 1.25, 3: 1.5 } as const;
const DECAY = 0.85; // each older attempt counts 15% less than the next newer one
export const MIN_ATTEMPTS = 3;

/**
 * Recency- and difficulty-weighted accuracy for one topic, 0–1.
 * Returns null when there is not enough evidence yet.
 */
export function topicMastery(attempts: Attempt[]): number | null {
  if (attempts.length < MIN_ATTEMPTS) return null;
  const sorted = [...attempts].sort((a, b) => b.at.localeCompare(a.at)); // newest first
  let num = 0;
  let den = 0;
  sorted.forEach((a, i) => {
    const w = Math.pow(DECAY, i) * DIFFICULTY_WEIGHT[a.difficulty];
    num += w * (a.correct ? 1 : 0);
    den += w;
  });
  return den === 0 ? null : num / den;
}

export function masteryByLecture(attempts: Attempt[], lectureIds: string[]): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const id of lectureIds) out[id] = topicMastery(attempts.filter((a) => a.lecture === id));
  return out;
}

/** Plain accuracy over all attempts (for the dashboard). */
export function accuracy(attempts: Attempt[]): number | null {
  if (!attempts.length) return null;
  return attempts.filter((a) => a.correct).length / attempts.length;
}

export type CalibrationFlag = "overconfident" | "underconfident" | "calibrated" | "unknown";

/**
 * Compares self-rated confidence (1–5) with demonstrated mastery (0–1).
 * Confidence c maps to an expected mastery of (c - 1) / 4.
 */
export function calibration(confidence: number, mastery: number | null): CalibrationFlag {
  if (!confidence || mastery === null) return "unknown";
  const expected = (confidence - 1) / 4;
  const gap = expected - mastery;
  if (gap > 0.25) return "overconfident";
  if (gap < -0.25) return "underconfident";
  return "calibrated";
}
