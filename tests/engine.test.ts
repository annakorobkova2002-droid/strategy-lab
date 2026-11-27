import { test } from "node:test";
import assert from "node:assert/strict";
import { review, LADDER, isDue, isMastered, ratingFromAnswer } from "../src/engine/scheduler";
import { addDays, daysBetween } from "../src/engine/dates";
import { topicMastery, calibration, accuracy } from "../src/engine/mastery";
import { readiness, streak } from "../src/engine/readiness";
import { rng, shuffle } from "../src/engine/shuffle";
import { buildSession, unlockedDifficulty, presentOptions } from "../src/engine/select";
import { emptyProgress, recordAnswer } from "../src/storage";
import type { Attempt, Question } from "../src/types";

const T = "2026-12-01";

test("date helpers", () => {
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
  assert.equal(daysBetween("2026-12-01", "2026-12-15"), 14);
});

test("scheduler follows the 1-3-7-14-30 ladder", () => {
  let s = review(undefined, "good", T);
  assert.equal(s.step, 0);
  assert.equal(s.due, addDays(T, 1));
  s = review(s, "good", T);
  assert.equal(s.due, addDays(T, 3));
  s = review(s, "easy", T);
  assert.equal(s.step, 3);
  assert.equal(s.due, addDays(T, 14));
  assert.ok(isMastered(s));
  s = review(s, "easy", T);
  assert.equal(s.due, addDays(T, LADDER[LADDER.length - 1])); // capped at 30 days
});

test("again resets and counts a lapse; hard keeps the step", () => {
  let s = review(review(review(undefined, "good", T), "good", T), "good", T); // step 2
  const hard = review(s, "hard", T);
  assert.equal(hard.step, 2);
  s = review(s, "again", T);
  assert.equal(s.step, 0);
  assert.equal(s.lapses, 1);
  assert.equal(s.due, addDays(T, 1));
});

test("due detection and answer→rating mapping", () => {
  const s = review(undefined, "good", T);
  assert.equal(isDue(s, T), false);
  assert.equal(isDue(s, addDays(T, 1)), true);
  assert.equal(ratingFromAnswer(true), "good");
  assert.equal(ratingFromAnswer(false), "again");
});

const att = (correct: boolean, at: string, difficulty: 1 | 2 | 3 = 1, lecture = "S05"): Attempt => ({
  questionId: "q" + at, lecture, correct, chosen: "a", difficulty, at,
});

test("mastery needs evidence and weights recent attempts more", () => {
  assert.equal(topicMastery([att(true, "2026-12-01T10:00:00Z")]), null);
  const improving = [att(false, "2026-12-01T10:00:00Z"), att(false, "2026-12-02T10:00:00Z"), att(true, "2026-12-03T10:00:00Z"), att(true, "2026-12-04T10:00:00Z")];
  const declining = [att(true, "2026-12-01T10:00:00Z"), att(true, "2026-12-02T10:00:00Z"), att(false, "2026-12-03T10:00:00Z"), att(false, "2026-12-04T10:00:00Z")];
  assert.ok(topicMastery(improving)! > 0.5);
  assert.ok(topicMastery(declining)! < 0.5);
  assert.equal(accuracy(improving), 0.5);
});

test("calibration distinguishes confidence from knowledge", () => {
  assert.equal(calibration(5, 0.3), "overconfident");
  assert.equal(calibration(1, 0.9), "underconfident");
  assert.equal(calibration(4, 0.75), "calibrated");
  assert.equal(calibration(0, 0.5), "unknown");
});

test("difficulty unlocks with mastery", () => {
  assert.equal(unlockedDifficulty(null), 2);
  assert.equal(unlockedDifficulty(0.4), 1);
  assert.equal(unlockedDifficulty(0.7), 2);
  assert.equal(unlockedDifficulty(0.9), 3);
});

test("shuffle is a permutation and deterministic with a seed", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8];
  const a = shuffle(items, rng(42));
  assert.deepEqual([...a].sort(), [...items].sort());
  assert.deepEqual(shuffle(items, rng(42)), a);
});

test("MCQ answer positions are spread evenly over many shuffles", () => {
  const q: Question = { id: "x", lecture: "S01", type: "mcq", difficulty: 1, stem: "?", answer: "a",
    options: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }, { id: "d", text: "D" }], explanation: "." };
  const counts = [0, 0, 0, 0];
  const r = rng(7);
  for (let i = 0; i < 4000; i++) counts[presentOptions(q, r).findIndex((o) => o.id === "a")]++;
  for (const c of counts) assert.ok(c > 850 && c < 1150, `position count ${c} not uniform`);
});

const mk = (id: string, lecture: string, difficulty: 1 | 2 | 3 = 1): Question => ({
  id, lecture, type: "tf", difficulty, stem: id, answer: "t", explanation: ".",
  options: [{ id: "t", text: "True" }, { id: "f", text: "False" }],
});

test("recordAnswer logs mistakes and resolves them when answered correctly", () => {
  const q = mk("q1", "S02");
  let p = recordAnswer(emptyProgress(), q, "f", new Date("2026-12-01T09:00:00"));
  assert.equal(p.mistakes.q1.count, 1);
  assert.equal(p.mistakes.q1.resolved, false);
  assert.equal(p.reviews.q1.step, 0);
  p = recordAnswer(p, q, "f", new Date("2026-12-02T09:00:00"));
  assert.equal(p.mistakes.q1.count, 2);
  p = recordAnswer(p, q, "t", new Date("2026-12-03T09:00:00"));
  assert.equal(p.mistakes.q1.resolved, true);
  assert.equal(p.attempts.length, 3);
  assert.deepEqual(p.studyDays, ["2026-12-01", "2026-12-02", "2026-12-03"]);
});

test("adaptive session puts unresolved mistakes first and respects size", () => {
  const qs = [mk("a", "S02"), mk("b", "S02"), mk("c", "S05"), mk("d", "S05", 3)];
  let p = emptyProgress();
  p = recordAnswer(p, qs[2], "f", new Date("2026-12-01T09:00:00"));
  const s = buildSession(qs, p, { size: 3, random: rng(1), today: "2026-12-01" });
  assert.equal(s.length, 3);
  assert.equal(s[0].id, "c");
  const onlyMistakes = buildSession(qs, p, { size: 10, onlyMistakes: true, random: rng(1) });
  assert.deepEqual(onlyMistakes.map((q) => q.id), ["c"]);
});

test("readiness is transparent and bounded; streak counts consecutive days", () => {
  const p = emptyProgress();
  assert.equal(readiness(p, ["S01", "S02"], T).score, 0);
  p.lectures = { S01: { completed: true, confidence: 3 }, S02: { completed: true, confidence: 3 } };
  p.studyDays = ["2026-11-29", "2026-11-30", "2026-12-01"];
  const r = readiness(p, ["S01", "S02"], T);
  assert.ok(r.score > 0 && r.score <= 100);
  assert.equal(r.coverage, 1);
  assert.equal(streak(p.studyDays, T), 3);
  assert.equal(streak(["2026-11-25"], T), 0);
  assert.equal(streak(["2026-11-30"], T), 1); // yesterday still counts
});
