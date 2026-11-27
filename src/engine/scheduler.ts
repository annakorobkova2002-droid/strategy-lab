import type { Rating, ReviewState } from "../types";
import { addDays, toDay } from "./dates";

/** Review interval ladder in days (spaced repetition). */
export const LADDER = [1, 3, 7, 14, 30] as const;

/**
 * Rule-based spaced repetition:
 *  - again → back to the first step (review tomorrow), counts a lapse
 *  - hard  → stay on the current step
 *  - good  → move up one step
 *  - easy  → move up two steps
 */
export function review(prev: ReviewState | undefined, rating: Rating, today: string = toDay()): ReviewState {
  const current = prev?.step ?? -1;
  let step: number;
  switch (rating) {
    case "again":
      step = 0;
      break;
    case "hard":
      step = Math.max(0, current);
      break;
    case "good":
      step = Math.min(LADDER.length - 1, current + 1);
      break;
    case "easy":
      step = Math.min(LADDER.length - 1, current + 2);
      break;
  }
  return {
    step,
    due: addDays(today, LADDER[step]),
    reps: (prev?.reps ?? 0) + 1,
    lapses: (prev?.lapses ?? 0) + (rating === "again" && prev ? 1 : 0),
    last: today,
  };
}

/** Quiz answers map onto ratings: wrong → again, correct → good. */
export function ratingFromAnswer(correct: boolean): Rating {
  return correct ? "good" : "again";
}

export function isDue(state: ReviewState | undefined, today: string = toDay()): boolean {
  return !!state && state.due <= today;
}

/** An item is "mastered" once it has climbed to the 14-day step or above. */
export function isMastered(state: ReviewState | undefined): boolean {
  return !!state && state.step >= 3;
}
