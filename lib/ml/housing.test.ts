import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { predict, validateModel, ModelError } from "./housing.ts";

const model = validateModel(JSON.parse(readFileSync(new URL("../../public/ml/house-price-model.json", import.meta.url), "utf8")));

test("matches the Python model on the reference houses", () => {
  assert.ok(model.reference.length >= 4);
  for (const ref of model.reference) {
    const got = predict(model, ref.inputs).price;
    assert.ok(Math.abs(got - ref.price) < 2, `expected ${ref.price}, got ${got}`);
  }
});

test("the notebook's sample house is about $328,846", () => {
  const got = predict(model, model.reference[0].inputs).price;
  assert.ok(Math.abs(got - 328846.25) < 2, String(got));
});

test("hidden layers have the real sizes and ReLU makes them non-negative", () => {
  const p = predict(model, model.reference[0].inputs);
  assert.equal(p.hidden1.length, 64);
  assert.equal(p.hidden2.length, 32);
  assert.ok(p.hidden1.every((v) => v >= 0) && p.hidden2.every((v) => v >= 0));
  assert.equal(p.hidden1.filter((v) => v > 0).length, 8);
  assert.equal(p.hidden2.filter((v) => v > 0).length, 24);
});

test("neuron averages match the layers and the typical firing counts", () => {
  assert.equal(model.activity.hidden1.length, 64);
  assert.equal(model.activity.hidden2.length, 32);
  assert.ok(model.activity.hidden1.every((v) => v >= 0));
  assert.ok(Math.abs(model.activity.typicalFiring1 - 27.4) < 0.2);
  assert.ok(Math.abs(model.activity.typicalFiring2 - 23.5) < 0.2);
  assert.equal(model.activity.houses, 21613);
});

test("slider defaults and ranges are sane", () => {
  for (const f of model.features) {
    assert.ok(f.min < f.max, f.name);
    assert.ok(f.default >= f.min || f.name === "yr_renovated" || f.name === "waterfront", `${f.name} default`);
  }
});

test("a broken file is rejected with a clear error", () => {
  assert.throws(() => validateModel({}), ModelError);
  const bad = structuredClone(model);
  bad.layers[1].w[0].pop();
  assert.throws(() => validateModel(bad), /layer 2 weight size/);
});
