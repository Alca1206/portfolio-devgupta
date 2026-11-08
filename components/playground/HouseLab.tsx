"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import Card from "@/components/ui/Card";
import NeuronBars from "./NeuronBars";
import PriceCurve from "./PriceCurve";
import { ModelError, predict, validateModel } from "@/lib/ml/housing";
import type { Feature, HouseInputs, HouseModel } from "@/lib/ml/housing";

const MODEL_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/ml/house-price-model.json`;

type Load = { model: HouseModel } | { error: string } | null;

const money = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

export default function HouseLab() {
  const [load, setLoad] = useState<Load>(null);
  const [inputs, setInputs] = useState<HouseInputs | null>(null);
  const [curveKey, setCurveKey] = useState("sqft_living");

  useEffect(() => {
    const controller = new AbortController();
    fetch(MODEL_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new ModelError(`The model file could not be loaded (${res.status}).`);
        return res.json();
      })
      .then((json) => {
        const model = validateModel(json);
        setLoad({ model });
        setInputs(model.reference[0].inputs); // starts as the notebook's sample house
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoad({
          error: err instanceof ModelError ? err.message : "The model could not be downloaded. Check your connection.",
        });
      });
    return () => controller.abort();
  }, []);

  const model = load && "model" in load ? load.model : null;
  const result = useMemo(() => (model && inputs ? predict(model, inputs) : null), [model, inputs]);

  const curve = useMemo(() => {
    if (!model || !inputs) return null;
    const f = model.features.find((x) => x.name === curveKey);
    if (!f) return null;
    const n = 40;
    const pts: [number, number][] = Array.from({ length: n + 1 }, (_, i) => {
      const x = f.min + ((f.max - f.min) * i) / n;
      return [x, predict(model, { ...inputs, [f.name]: x }).price];
    });
    return { feature: f, points: pts };
  }, [model, inputs, curveKey]);

  if (!load) {
    return <p className="text-ink-muted" role="status">Loading the trained model…</p>;
  }
  if ("error" in load) {
    return (
      <div role="alert" className="rounded-lg border border-violet/60 bg-surface p-6">
        <p className="font-medium">The model could not start.</p>
        <p className="mt-2 text-ink-muted">{load.error}</p>
      </div>
    );
  }
  if (!model || !inputs || !result) return null;

  const set = (patch: Partial<HouseInputs>) => setInputs({ ...inputs, ...patch });
  const slider = (f: Feature) => {
    if (f.name === "yr_renovated") {
      const renovated = inputs.yr_renovated > 0;
      return (
        <div key={f.name} className="grid gap-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={renovated}
              onChange={(e) => set({ yr_renovated: e.target.checked ? 2000 : 0 })}
            />
            Renovated
          </label>
          {renovated && (
            <label className="grid gap-1 text-sm">
              <span className="flex justify-between text-ink-muted">
                Year renovated <span className="font-mono text-ink">{inputs.yr_renovated}</span>
              </span>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={1}
                value={inputs.yr_renovated}
                onChange={(e) => set({ yr_renovated: Number(e.target.value) })}
                className="accent-[var(--color-violet)]"
              />
            </label>
          )}
        </div>
      );
    }
    const value = inputs[f.name as keyof HouseInputs] as number;
    return (
      <label key={f.name} className="grid gap-1 text-sm">
        <span className="flex justify-between text-ink-muted">
          {f.label}{" "}
          <span className="font-mono text-ink">
            {f.name.startsWith("yr_") ? value : value.toLocaleString("en-US")}
          </span>
        </span>
        <input
          type="range"
          min={f.min}
          max={f.max}
          step={f.step}
          value={value}
          onChange={(e) => set({ [f.name]: Number(e.target.value) } as Partial<HouseInputs>)}
          className="accent-[var(--color-violet)]"
        />
      </label>
    );
  };

  const main = model.features.filter((f) => f.group === "main");
  const more = model.features.filter((f) => f.group === "more");
  const curveFeatures = model.features.filter((f) => f.name !== "yr_renovated" && f.name !== "waterfront");
  const outside = result.price < 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
      <Card className="h-full !p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">The house</h2>
          <button
            type="button"
            onClick={() => setInputs(model.reference[0].inputs)}
            className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs hover:border-violet"
          >
            <RotateCcw size={12} aria-hidden="true" /> Reset
          </button>
        </div>
        <p className="mt-1 text-xs text-ink-muted">Starts as the notebook&apos;s sample house.</p>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-ink-muted">Zipcode</span>
            <select
              value={inputs.zipcode}
              onChange={(e) => {
                const z = model.zipcodes.find((x) => x.zip === e.target.value);
                if (z) set({ zipcode: z.zip, lat: z.lat, long: z.long });
              }}
              className="rounded-md border border-line bg-space px-2 py-1.5"
            >
              {model.zipcodes.map((z) => (
                <option key={z.zip} value={z.zip}>
                  {z.zip}
                </option>
              ))}
            </select>
          </label>
          {main.map(slider)}
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-violet hover:text-cyan">More details</summary>
          <div className="mt-4 grid gap-4">
            {more.map(slider)}
            <p className="text-xs text-ink-muted">
              Latitude and longitude follow the zipcode (its middle point in the data).
            </p>
          </div>
        </details>
      </Card>

      <div className="grid min-w-0 gap-5 lg:grid-rows-[auto_1fr]">
        <Card className="!p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
            <div>
              <p className="text-sm text-ink-muted">Estimated price</p>
              <p className="mt-1 font-display text-4xl font-semibold tabular-nums" aria-live="polite">
                {outside ? "Outside what the model learned" : money(result.price)}
              </p>
            </div>
            <p className="max-w-sm text-balance border-l border-line pl-6 text-xs leading-relaxed text-ink-muted">
              Real trained network, running in your browser. Average error on unseen houses about
              $72,500 (R² 88%), King County 2014 to 2015 only: a demonstration, not a valuation.
            </p>
          </div>
        </Card>

        <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <Card className="!p-5">
          <h2 className="font-display text-lg font-semibold">Inside the network</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Weights are fixed; only the inputs change. Each bar is one neuron (0 means off).
          </p>
          <div className="mt-4 grid gap-4">
            <NeuronBars
              label="Hidden layer 1"
              values={result.hidden1}
              average={model.activity.hidden1}
              typical={model.activity.typicalFiring1}
            />
            <NeuronBars
              label="Hidden layer 2"
              values={result.hidden2}
              average={model.activity.hidden2}
              typical={model.activity.typicalFiring2}
            />
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-violet" aria-hidden="true" /> this house
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-line" aria-hidden="true" /> average over all{" "}
              {model.activity.houses.toLocaleString("en-US")} houses
            </span>
            <span>Square-root scale.</span>
          </p>
        </Card>

        {curve && (
          <Card className="!p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">What if only one thing changed?</h2>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-ink-muted">Change</span>
                <select
                  value={curveKey}
                  onChange={(e) => setCurveKey(e.target.value)}
                  className="rounded-md border border-line bg-space px-2 py-1.5"
                >
                  {curveFeatures.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Everything else stays as set. The curve is what the model learned about this one
              feature, including where it looks odd.
            </p>
            <div className="mt-3">
              <PriceCurve
                points={curve.points}
                current={[inputs[curve.feature.name as keyof HouseInputs] as number, result.price]}
                xLabel={curve.feature.label}
                plainNumbers={curve.feature.name.startsWith("yr_")}
              />
            </div>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
