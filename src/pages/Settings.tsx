import { useRef, useState } from "react";
import { useStore } from "../store";
import { emptyProgress, exportJson, importJson } from "../storage";
import { toDay } from "../engine/dates";
import type { Settings as S } from "../types";

export function Settings() {
  const { progress: p, update, replace } = useStore();
  const [msg, setMsg] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<S>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const doExport = () => {
    const blob = new Blob([exportJson(p)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `strategy-lab-progress-${toDay()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg("Progress exported.");
  };
  const doImport = async (f: File) => {
    try {
      replace(importJson(await f.text()));
      setMsg("Progress imported successfully.");
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`);
    }
  };
  const doReset = () => {
    if (window.confirm("Reset ALL progress? This deletes your answers, flashcard schedule, mistakes and settings in this browser. Export a backup first if unsure.")) {
      replace(emptyProgress());
      setMsg("Progress reset.");
    }
  };

  return (
    <div className="page narrow">
      <header className="page-head">
        <p className="kicker">Settings & data</p>
        <h1>Settings</h1>
      </header>
      <section className="panel form">
        <label><span>Exam date</span><input type="date" value={p.settings.examDate} onChange={(e) => set({ examDate: e.target.value })} /></label>
        <label><span>Daily question goal</span><input type="number" min={5} max={200} value={p.settings.dailyGoal} onChange={(e) => set({ dailyGoal: Math.max(5, Number(e.target.value) || 20) })} /></label>
        <label><span>Theme</span>
          <select value={p.settings.theme} onChange={(e) => set({ theme: e.target.value as S["theme"] })}>
            <option value="system">Follow system</option><option value="light">Light</option><option value="dark">Dark</option>
          </select>
        </label>
      </section>
      <section className="panel">
        <h2>Your data</h2>
        <p className="muted">Progress is stored only in this browser (localStorage). Export a backup to move it to another device.</p>
        <div className="row">
          <button className="btn" onClick={doExport}>Export progress</button>
          <button className="btn" onClick={() => file.current?.click()}>Import progress</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
          <button className="btn danger" onClick={doReset}>Reset progress</button>
        </div>
        {msg && <p className="notice" role="status">{msg}</p>}
      </section>
      <section className="panel">
        <h2>About</h2>
        <p className="muted small">Strategy Lab is a personal study tool for Business Strategy (Università Cattolica, A.Y. 2026–27). The adaptive engine is rule-based (spaced repetition 1-3-7-14-30 days, recency-weighted mastery); it is not AI. The readiness score is a practice estimate, not a predicted grade. Researched guest-speaker profiles use public company information and are not lecture content.</p>
      </section>
    </div>
  );
}
