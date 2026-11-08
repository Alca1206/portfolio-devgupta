import { test } from "node:test";
import assert from "node:assert/strict";
import { demos, demoForProject } from "../data/demos.ts";
import { projects } from "../data/projects.ts";
import { labs } from "../data/labs.ts";
import { playgroundEntries } from "./playground.ts";

test("demo slugs are unique and URL-safe", () => {
  const slugs = demos.map((d) => d.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const s of slugs) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("a demo's project exists, and a project has at most one demo", () => {
  const used = demos.map((d) => d.projectSlug).filter((s): s is string => s !== null);
  assert.equal(new Set(used).size, used.length);
  for (const s of used) assert.ok(projects.some((p) => p.slug === s), `unknown project ${s}`);
  for (const p of projects) assert.ok(demoForProject(p.slug) === undefined || used.includes(p.slug));
});

test("every step points at a real stage and has text", () => {
  for (const d of demos) {
    assert.ok(d.steps.length >= 2, `${d.slug}: too few steps`);
    const ids = new Set(d.stages.map((s) => s.id));
    assert.equal(ids.size, d.stages.length, `${d.slug}: duplicate stage id`);
    assert.ok(d.title.trim() && d.summary.trim());
    for (const s of d.steps) {
      assert.ok(ids.has(s.stage), `${d.slug}: unknown stage ${s.stage}`);
      assert.ok(s.title.trim() && s.text.trim(), `${d.slug}: empty step text`);
      assert.ok(s.visual !== "none" || (s.rows && s.rows.length > 0), `${d.slug}: step shows nothing`);
      if (s.visual === "chart") assert.ok(s.chart && s.chart.points.length > 1, `${d.slug}: chart without data`);
      for (const c of s.code ?? []) assert.ok(c.file && c.code.trim(), `${d.slug}: empty code snippet`);
    }
  }
});

test("a recorded demo says where its numbers come from", () => {
  for (const d of demos) {
    if (d.kind !== "recorded") continue;
    assert.ok(d.source, `${d.slug}: recorded demo needs a source`);
    assert.match(d.source.commit, /^[0-9a-f]{40}$/);
    assert.match(d.source.repoUrl, /^https:\/\/github\.com\/[^/]+\/[^/]+$/);
  }
});

test("labs have unique slugs and belong to a project", () => {
  const slugs = labs.map((l) => l.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const l of labs) {
    assert.match(l.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(projects.some((p) => p.slug === l.projectSlug), `unknown project ${l.projectSlug}`);
  }
});

test("each project has one Playground page, and none uses a reserved address", () => {
  const entries = playgroundEntries();
  assert.ok(entries.length >= 1);
  const slugs = entries.map((e) => e.project.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  const reserved = ["calibration", "house-price-model", "house-price-prediction"];
  for (const s of slugs) assert.ok(!reserved.includes(s), `${s} is a reserved address`);
  for (const e of entries) assert.ok(e.lab || e.demo);
});
