import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DemoDataError, passesGate1, topChunks, validateDemo } from "./paperpilot-demo.ts";

// A small synthetic file (made with fake embeddings): it tests the code, not real scores.
const raw = JSON.parse(readFileSync(new URL("./paperpilot-demo.fixture.json", import.meta.url), "utf8"));
const demo = validateDemo(raw);

test("topChunks returns the best chunks first and at most top_k", () => {
  const q = demo.questions[0];
  const top = topChunks(demo, q);
  assert.ok(top.length <= demo.settings.top_k);
  for (let i = 1; i < top.length; i++) assert.ok(top[i - 1].score >= top[i].score);
  assert.equal(top[0].score, Math.max(...q.scores));
});

test("gate 1 refuses below the threshold and passes at or above it (like Python's `best < min`)", () => {
  assert.equal(passesGate1(0.34, 0.35), false);
  assert.equal(passesGate1(0.35, 0.35), true);
  assert.equal(passesGate1(0.9, 0.35), true);
  assert.equal(passesGate1(undefined, 0.35), false);
});

test("recorded statuses agree with gate 1 at the recorded threshold", () => {
  for (const q of demo.questions) {
    if (!q.answer) continue;
    const best = Math.max(...q.scores);
    const passes = passesGate1(best, demo.settings.min_score);
    assert.equal(q.answer.status !== "no_relevant_chunks", passes, q.text);
  }
});

test("rejects data that does not line up", () => {
  const bad = structuredClone(raw);
  bad.questions[0].scores.pop();
  assert.throws(() => validateDemo(bad), DemoDataError);
  assert.throws(() => validateDemo({ version: 2 }), DemoDataError);
});
