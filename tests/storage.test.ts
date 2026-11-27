import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyProgress, migrate, load, save, exportJson, importJson, recordCard, STORAGE_KEY } from "../src/storage";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
}

test("save/load round-trip persists progress", () => {
  const s = new MemoryStorage();
  const p = emptyProgress();
  p.settings.examDate = "2026-12-15";
  assert.equal(save(p, s), true);
  assert.equal(load(s).settings.examDate, "2026-12-15");
});

test("corrupted storage falls back to empty progress", () => {
  const s = new MemoryStorage();
  s.setItem(STORAGE_KEY, "{not json");
  assert.deepEqual(load(s), emptyProgress());
});

test("migrate fills missing fields and rejects unknown versions", () => {
  const p = migrate({ settings: { examDate: "2027-01-10" }, attempts: [{ questionId: "a" }, null] });
  assert.equal(p.settings.theme, "system");
  assert.equal(p.settings.examDate, "2027-01-10");
  assert.equal(p.attempts.length, 1);
  assert.throws(() => migrate({ version: 99 }));
});

test("export/import round-trip", () => {
  let p = emptyProgress();
  p = recordCard(p, "S05-def-0", "good", new Date("2026-12-01T10:00:00"));
  const back = importJson(exportJson(p));
  assert.deepEqual(back.reviews, p.reviews);
  assert.deepEqual(back.studyDays, ["2026-12-01"]);
});

test("save reports failure when storage throws (quota)", () => {
  const broken = { setItem() { throw new Error("QuotaExceeded"); } };
  assert.equal(save(emptyProgress(), broken), false);
});
