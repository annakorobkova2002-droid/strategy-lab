export type SectionKind = "goals" | "traps" | "selftest" | "memo" | "definitions" | "normal";

export interface Section {
  id: string;
  heading: string;
  kind: SectionKind;
  html: string;
}

export interface Lecture {
  id: string;
  code: string;
  title: string;
  module: string;
  readings: string;
  sections: Section[];
  summary: string[];
  definitions: { term: string; definition: string }[];
  wordCount: number;
}

export interface Option {
  id: string;
  text: string;
  why?: string;
}

export interface Question {
  id: string;
  lecture: string;
  type: "mcq" | "tf";
  difficulty: 1 | 2 | 3;
  stem: string;
  options: Option[];
  answer: string;
  explanation: string;
  source?: string;
}

export interface Flashcard {
  id: string;
  lecture: string;
  front: string;
  back: string;
  kind: string;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  lecture: string;
  lectureCode: string;
}

export interface Content {
  lectures: Lecture[];
  questions: Question[];
  flashcards: Flashcard[];
  glossary: GlossaryEntry[];
}

/** Spaced-repetition state for any reviewable item (question or flashcard). */
export interface ReviewState {
  step: number; // index into the interval ladder
  due: string; // ISO date (YYYY-MM-DD)
  reps: number;
  lapses: number;
  last?: string;
}

export type Rating = "again" | "hard" | "good" | "easy";

export interface Attempt {
  questionId: string;
  lecture: string;
  correct: boolean;
  chosen: string;
  difficulty: 1 | 2 | 3;
  at: string; // ISO datetime
}

export interface MistakeRecord {
  questionId: string;
  lecture: string;
  count: number;
  lastChosen: string;
  lastAt: string;
  resolved: boolean;
}

export interface LectureProgress {
  completed: boolean;
  confidence: number; // 0 = not rated, 1–5
  lastOpened?: string;
}

export interface Settings {
  examDate: string; // YYYY-MM-DD or ""
  theme: "system" | "light" | "dark";
  dailyGoal: number; // questions per day
}

export interface Progress {
  version: 1;
  settings: Settings;
  lectures: Record<string, LectureProgress>;
  reviews: Record<string, ReviewState>;
  attempts: Attempt[];
  mistakes: Record<string, MistakeRecord>;
  studyDays: string[]; // unique YYYY-MM-DD
}
