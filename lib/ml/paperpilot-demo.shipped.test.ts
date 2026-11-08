import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { passesGate1, validateDemo } from "./paperpilot-demo.ts";

// Checks the real recorded run once it has been added (skipped until then).
const file = new URL("../../public/ml/paperpilot-demo.json", import.meta.url);
const present = existsSync(file);

test("the recorded PaperPilot run is valid and internally consistent", { skip: !present }, () => {
  const demo = validateDemo(JSON.parse(readFileSync(file, "utf8")));
  for (const q of demo.questions) {
    const best = Math.max(...q.scores);
    if (!q.answer) continue;
    // PaperPilot's own best score is the best chunk score (rounded to 4 places).
    assert.ok(Math.abs((q.answer.best_score ?? NaN) - best) < 0.0006, `${q.text}: best score`);
    // Gate 1 at the recorded threshold decides whether the model was called.
    assert.equal(q.answer.status !== "no_relevant_chunks", passesGate1(best, demo.settings.min_score), q.text);
    // Every citation points at a chunk that exists, on the page that chunk is on.
    for (const c of q.answer.citations) {
      const chunk = demo.chunks.find((x) => x.id === c.chunk_id);
      assert.ok(chunk, `${q.text}: citation ${c.chunk_id}`);
      assert.equal(chunk.page, c.page);
    }
  }
});
