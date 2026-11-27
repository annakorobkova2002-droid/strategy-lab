// Converts the academic content (Markdown lectures + JSON question bank) into one
// generated JSON file that the app imports. Run: `npm run content` (or --check to validate only).
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK_ONLY = process.argv.includes("--check");
const rules = JSON.parse(readFileSync(join(ROOT, "scripts/clean-rules.json"), "utf8"));

const SECTION_KIND = [
  ["learning objectives", "goals"],
  ["exam traps", "traps"],
  ["likely open questions", "selftest"],
  ["memorise this", "memo"],
  ["core definitions", "definitions"],
];

const TAG = /\s*`\[[A-Z]+\](?:\[[A-Z]+\])*`(?:\s*\+\s*`\[[A-Z]+\](?:\[[A-Z]+\])*`)*/g;
const norm = (s) => s.replace(TAG, "").replace(/[ \t]+:/g, ":").replace(/(?<=\S) {2,}/g, " ").replace(/ +,/g, ",");

/** Strip provenance tags and internal audit notes for student-facing display. */
export function clean(md) {
  md = md.replace(/^> \*\*Provenance key:.*\n/gm, "");
  md = norm(md);
  for (const [a, b] of rules.exact) md = md.split(norm(a)).join(b);
  md = md.replace(/^> No lecture material is available\..*$/gm, rules.guestNote);
  md = md.replace(/\s+(prior year\s*\+\s*)?(\+\s*)?⚠\s*$/gm, "");
  md = md.replace(/\s*\((?:see )?audit(?: item)? C\d+\)/g, "");
  return md;
}

/** Python-Markdown-style nested lists use 3-space indents; marked needs consistent ones. */
function fixLists(md) {
  return md.replace(/^ {1,3}(-|\d+\.) /gm, "    $1 ");
}

const plain = (s) => s.replace(/\*\*|__|\*|`/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1").trim();
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function parseLecture(file) {
  const raw = readFileSync(join(ROOT, "content/lectures", file), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Missing front matter: ${file}`);
  const meta = Object.fromEntries([...m[1].matchAll(/^(\w+):\s*(.*)$/gm)].map((x) => [x[1], x[2].trim()]));
  const body = fixLists(clean(m[2]));
  const titleLine = body.match(/^# (.+)$/m)?.[1] ?? file;
  const [code, ...rest] = titleLine.split(" — ");
  const title = rest.length ? rest.join(" — ") : titleLine;
  const chunks = body.replace(/^# .+$/m, "").split(/^## /m).slice(1);
  const sections = chunks.map((chunk) => {
    const nl = chunk.indexOf("\n");
    const heading = chunk.slice(0, nl).replace(/^\d+\.\s*/, "").trim();
    const content = chunk.slice(nl + 1).trim();
    const kind = SECTION_KIND.find(([k]) => heading.toLowerCase().startsWith(k))?.[1] ?? "normal";
    return { id: slug(heading), heading, kind, html: marked.parse(content) };
  });
  // Definitions → glossary + flashcards
  const definitions = [];
  for (const chunk of chunks) {
    if (!/^(\d+\.\s*)?core definitions/i.test(chunk)) continue;
    for (const row of chunk.split("\n").filter((l) => l.startsWith("| **"))) {
      const cells = row.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.length >= 2) definitions.push({ term: plain(cells[0]), definition: plain(cells.slice(1).join(" ")) });
    }
  }
  const memo = sections.find((s) => s.kind === "memo");
  const summary = memo ? [...memo.html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => x[1].replace(/<[^>]+>/g, "").trim()) : [];
  const readings = (meta.readings ?? "").replace(/^\[|\]$/g, "").replace(/"/g, "").trim();
  return {
    id: meta.id,
    code: code.trim(),
    title: title.trim(),
    module: meta.module ?? "",
    readings,
    sections,
    summary,
    definitions,
    wordCount: plain(body).split(/\s+/).length,
  };
}

const lectures = readdirSync(join(ROOT, "content/lectures")).filter((f) => f.endsWith(".md")).sort().map(parseLecture);

const questions = readdirSync(join(ROOT, "content/questions"))
  .filter((f) => f.endsWith(".json")).sort()
  .flatMap((f) => JSON.parse(readFileSync(join(ROOT, "content/questions", f), "utf8")));

// ---- validation ----
const errors = [];
const lectureIds = new Set(lectures.map((l) => l.id));
const seen = new Set();
for (const q of questions) {
  if (seen.has(q.id)) errors.push(`duplicate question id ${q.id}`);
  seen.add(q.id);
  if (!lectureIds.has(q.lecture)) errors.push(`${q.id}: unknown lecture ${q.lecture}`);
  if (!["mcq", "tf"].includes(q.type)) errors.push(`${q.id}: bad type`);
  if (![1, 2, 3].includes(q.difficulty)) errors.push(`${q.id}: bad difficulty`);
  if (!q.options?.some((o) => o.id === q.answer)) errors.push(`${q.id}: answer not among options`);
  if (q.type === "mcq" && q.options.length !== 4) errors.push(`${q.id}: MCQ needs 4 options`);
  if (!q.explanation) errors.push(`${q.id}: missing explanation`);
}
if (errors.length) {
  console.error("Content validation failed:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}

const flashcards = lectures.flatMap((l) =>
  l.definitions.map((d, i) => ({ id: `${l.id}-def-${i}`, lecture: l.id, front: d.term, back: d.definition, kind: "definition" })),
);
const glossary = lectures
  .flatMap((l) => l.definitions.map((d) => ({ ...d, lecture: l.id, lectureCode: l.code })))
  .sort((a, b) => a.term.localeCompare(b.term));

console.log(`lectures ${lectures.length} · questions ${questions.length} · flashcards ${flashcards.length} · glossary ${glossary.length}`);
if (!CHECK_ONLY) {
  mkdirSync(join(ROOT, "src/generated"), { recursive: true });
  writeFileSync(join(ROOT, "src/generated/content.json"), JSON.stringify({ lectures, questions, flashcards, glossary }));
}
