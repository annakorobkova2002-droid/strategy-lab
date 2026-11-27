# Content guide

All academic content lives in `content/`. The app and the PDF notes are generated from these files, so edit them here only.

## Lectures — `content/lectures/*.md`

Each file starts with front matter:

```yaml
---
id: S05                 # unique id used by questions and progress
sessions: [5]
title: "Analysing Resources and Capabilities"
module: B               # A–G lecture modules, H = guest speakers
readings: ["Grant & Jordan ch.3"]
---
```

Then `# S5 — Title` and numbered `## ` sections. Special section names get their own styling and features:

| Heading starts with | Used as |
|---|---|
| `Learning objectives` | Learning goals box |
| `Core definitions` | A table of `\| **Term** \| Definition \|` rows → **flashcards + glossary** automatically |
| `Exam traps` | Red traps box |
| `Likely open questions` | Self-test box |
| `Memorise this` | Sticky note + the lecture's **condensed summary** |

Source tags such as `` `[PN]` `` (your notes), `` `[SD]` ``, `` `[TB]` `` and `` `[REC]` `` record provenance in the source files. They are stripped automatically from what students see (`scripts/clean-rules.json`).

## Questions — `content/questions/*.json`

```json
{
  "id": "S05-006",
  "lecture": "S05",
  "type": "mcq",
  "difficulty": 2,
  "stem": "Question text",
  "options": [
    {"id": "a", "text": "Correct option"},
    {"id": "b", "text": "Distractor", "why": "Why it is wrong"},
    {"id": "c", "text": "Distractor", "why": "..."},
    {"id": "d", "text": "Distractor", "why": "..."}
  ],
  "answer": "a",
  "explanation": "Why the answer is right",
  "source": "S5 · VRIO"
}
```

- `type`: `mcq` (exactly 4 options) or `tf` (options `t` / `f`).
- `difficulty`: 1 foundational · 2 intermediate · 3 advanced.
- Answer positions are **shuffled at runtime**, so the stored order doesn't matter.
- Run `npm run validate` to check ids, lectures, answers and option counts. The build fails on errors.
