import raw from "./generated/content.json";
import type { Content, Lecture } from "./types";

export const content = raw as unknown as Content;
export const lectures: Lecture[] = content.lectures;
export const studyLectures: Lecture[] = lectures.filter((l) => l.module !== "H");
export const lectureById = Object.fromEntries(lectures.map((l) => [l.id, l])) as Record<string, Lecture>;

export const MODULES: Record<string, string> = {
  A: "Foundations & external environment",
  B: "Internal analysis & competitive advantage",
  C: "Dynamics & new market space",
  D: "International strategy",
  E: "Business models",
  F: "Sustainability",
  G: "Strategic change & competitive interaction",
  H: "Guest speakers",
};

export const lectureLabel = (id: string) => {
  const l = lectureById[id];
  return l ? `${l.code} · ${l.title}` : id;
};
