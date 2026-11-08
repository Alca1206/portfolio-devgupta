import { test } from "node:test";
import assert from "node:assert/strict";
import { projects } from "../data/projects.ts";
import { palette, paletteNames } from "../data/palette.ts";
import { accentName, accentColors, accentStyle } from "./accents.ts";

test("the first projects each get a different colour", () => {
  const first = projects.slice(0, paletteNames.length).map((p) => accentName(p, projects));
  assert.equal(new Set(first).size, first.length);
});

test("the assignment never changes between calls", () => {
  const a = projects.map((p) => accentName(p, projects));
  const b = projects.map((p) => accentName(p, projects));
  assert.deepEqual(a, b);
});

test("adding a project at the end does not change the others", () => {
  const extra = [...projects, { slug: "brand-new-one" }];
  for (const p of projects) assert.equal(accentName(p, extra), accentName(p, projects));
});

test("an explicit accent wins", () => {
  const pinned = { slug: projects[0].slug, accent: "amber" as const };
  assert.equal(accentName(pinned, projects), "amber");
});

test("every palette colour is a valid hex and the style sets the variables", () => {
  for (const c of Object.values(palette)) {
    assert.match(c.main, /^#[0-9a-f]{6}$/i);
    assert.match(c.second, /^#[0-9a-f]{6}$/i);
  }
  const s = accentStyle(projects[0], projects);
  assert.equal(s["--color-violet"], accentColors(projects[0], projects).main);
  assert.ok("--color-accent2" in s);
});
