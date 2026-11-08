// Runs the trained house-price network in the browser. The weights come from the project's
// saved model (see scripts/export_house_model.py), so the numbers match the real app.
// No imports here, so the node test runner can load this file directly.

export type Feature = {
  name: string;
  label: string;
  kind: "int" | "float";
  step: number;
  group: "main" | "more";
  min: number;
  max: number;
  default: number;
};

export type HouseModel = {
  schemaVersion: number;
  source: { repo: string; commit: string };
  columns: string[];
  mean: number[];
  scale: number[];
  layers: { w: number[][]; b: number[] }[];
  features: Feature[];
  zipcodes: { zip: string; lat: number; long: number }[];
  reference: { inputs: HouseInputs; price: number }[];
  /** Average neuron activity over every house in the training data (real values). */
  activity: {
    hidden1: number[];
    hidden2: number[];
    typicalFiring1: number;
    typicalFiring2: number;
    houses: number;
  };
};

export type HouseInputs = {
  bedrooms: number;
  bathrooms: number;
  sqft_living: number;
  sqft_lot: number;
  floors: number;
  waterfront: number;
  view: number;
  condition: number;
  grade: number;
  sqft_basement: number;
  yr_built: number;
  yr_renovated: number;
  zipcode: string;
  lat: number;
  long: number;
  sqft_living15: number;
  sqft_lot15: number;
};

export type Prediction = {
  price: number;
  /** Output of the first and second hidden layers, after ReLU (real values). */
  hidden1: number[];
  hidden2: number[];
};

export class ModelError extends Error {}

/** Checks the shape of the downloaded file, so a broken file gives a clear message. */
export function validateModel(raw: unknown): HouseModel {
  const m = raw as HouseModel;
  const fail = (why: string): never => {
    throw new ModelError(`The model file is not valid: ${why}`);
  };
  if (!m || typeof m !== "object") return fail("it is not an object");
  if (m.schemaVersion !== 1) return fail("unknown schema version");
  const n = m.columns?.length;
  if (!n || m.mean?.length !== n || m.scale?.length !== n) return fail("scaler does not match the columns");
  if (m.layers?.length !== 3) return fail("expected three layers");
  let width = n;
  for (const [i, l] of m.layers.entries()) {
    if (!l.w.length || l.b.length !== l.w.length) return fail(`layer ${i + 1} bias size`);
    if (l.w.some((row) => row.length !== width)) return fail(`layer ${i + 1} weight size`);
    width = l.w.length;
  }
  if (width !== 1) return fail("the last layer must have one output");
  const act = m.activity;
  if (!act || act.hidden1?.length !== m.layers[0].w.length || act.hidden2?.length !== m.layers[1].w.length)
    return fail("neuron averages do not match the layers");
  if (!m.features?.length || !m.zipcodes?.length) return fail("missing features or zipcodes");
  return m;
}

function dense(w: number[][], b: number[], x: number[], relu: boolean): number[] {
  return w.map((row, j) => {
    let s = b[j];
    for (let i = 0; i < row.length; i++) s += row[i] * x[i];
    return relu && s < 0 ? 0 : s;
  });
}

/** Same steps as the project's API: one-hot zipcode, column order, scaling, network. */
export function predict(model: HouseModel, inputs: HouseInputs): Prediction {
  const raw = model.columns.map((c) =>
    c.startsWith("zipcode_") ? (inputs.zipcode === c.slice(8) ? 1 : 0) : (inputs[c as keyof HouseInputs] as number),
  );
  const x = raw.map((v, i) => (v - model.mean[i]) / model.scale[i]);
  const [l1, l2, l3] = model.layers;
  const hidden1 = dense(l1.w, l1.b, x, true);
  const hidden2 = dense(l2.w, l2.b, hidden1, true);
  const price = dense(l3.w, l3.b, hidden2, false)[0];
  return { price, hidden1, hidden2 };
}
