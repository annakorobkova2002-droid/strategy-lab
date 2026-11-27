# Strategy Lab — Business Strategy Exam Preparation

A personal study platform for **Business Strategy** (Università Cattolica del Sacro Cuore, A.Y. 2026–27, Group A–K, Prof. Giacomo Ciambotti).
It runs entirely in the browser: no backend, no paid API, no account. Progress is stored in your browser.

## What's inside (v0.1 — MVP)

| Module | Status |
|---|---|
| Dashboard: readiness estimate, streak, countdown, daily goal, weakest and strongest topics, recommended next session | ✅ |
| Lecture library: full notes, condensed summary, key definitions, flashcards and quiz per lecture; completion and confidence rating; full-text search | ✅ |
| Adaptive quiz: one question at a time, shuffled answers, immediate feedback, why each wrong option is wrong, source reference, keyboard shortcuts | ✅ |
| Spaced repetition (1 → 3 → 7 → 14 → 30 days) for questions and flashcards | ✅ |
| Mistake notebook: automatic, filter by topic, "repeat only my mistakes" | ✅ |
| Flashcards (Again / Hard / Good / Easy), generated from every lecture's definitions | ✅ |
| Academic glossary | ✅ |
| Export, import and reset of progress; light and dark mode; responsive; keyboard accessible | ✅ |
| Framework lab, case simulator, mock exam, study planner | ⏳ Phase 5 |
| Full question bank (target ≈ 560) | ⏳ Phase 6 (91 starter questions now) |

The adaptive engine is **rule-based**, not AI. The readiness score is a **practice estimate**, not a predicted grade.

## Repository layout

```
content/
  lectures/        Markdown notes (one file per lecture + guest library); single source of truth
  questions/       JSON question bank (validated at build time)
scripts/
  build-content.mjs  Markdown + JSON → src/generated/content.json (+ validation)
  build-app.mjs      esbuild bundle → dist/ (static site)
  clean-rules.json   rules that strip internal source tags from student-facing text
src/
  engine/          scheduler, mastery, readiness, selection, shuffle (pure, unit-tested)
  pages/           Dashboard, Library, Lecture, Quiz, Flashcards, Mistakes, Glossary, Settings
  components/      QuestionCard, UI primitives, error boundary
  storage.ts       versioned localStorage persistence, export/import, migrations
tests/             node:test unit tests (scheduling, scoring, storage)
public/            index.html + styles.css (design system)
.github/workflows/deploy.yml   test → build → deploy to GitHub Pages
```

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run build      # static site in dist/
```

## Deploy

Pushing to `main` runs the workflow: validate content → tests → type check → build → publish to GitHub Pages.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Updating the academic content

Edit the Markdown in `content/lectures/` or the JSON in `content/questions/` and push. No app code changes are needed. See [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).

## Content and copyright

All notes and questions are **original revision summaries** written for personal study. The repository does **not** contain lecture slides, textbook text or third-party notes. Researched guest-speaker profiles are based on public company information and are labelled as such; they are not lecture content.
