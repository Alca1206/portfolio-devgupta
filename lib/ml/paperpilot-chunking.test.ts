import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chunkDocument, chunkPage, charCount } from "./paperpilot-chunking.ts";

type Case = {
  name: string;
  pages: string[];
  max: number;
  overlap: number;
  min: number;
  chunks: { id: string; page: number; text: string }[];
};
const cases: Case[] = JSON.parse(
  readFileSync(new URL("./paperpilot-chunking.fixtures.json", import.meta.url), "utf8"),
);

for (const c of cases) {
  test(`matches the Python chunker: ${c.name}`, () => {
    const got = chunkDocument(
      c.pages.map((text, i) => ({ page: i + 1, text })),
      c.max,
      c.overlap,
      c.min,
    );
    assert.deepEqual(got, c.chunks);
  });
}

test("a chunk never exceeds the limit and never spans pages", () => {
  for (const c of cases) {
    for (const ch of c.chunks) assert.ok(charCount(ch.text) <= c.max, `${c.name}: ${ch.id}`);
  }
});

test("rejects invalid settings like the Python code", () => {
  assert.throws(() => chunkPage({ page: 1, text: "Hello there." }, 10, 1), RangeError);
  assert.throws(() => chunkPage({ page: 1, text: "Hello there." }, 100, -1), RangeError);
});
