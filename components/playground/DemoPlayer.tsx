"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Card from "@/components/ui/Card";
import NetworkDrawing from "./NetworkDrawing";
import StageMap from "./StageMap";
import LossChart from "./LossChart";
import CodeBlock from "./CodeBlock";
import type { Demo } from "@/data/demos";

const STEP_MS = 5000;

export default function DemoPlayer({ demo }: { demo: Demo }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = demo.steps.length - 1;
  const step = demo.steps[index];
  const activeStage = demo.stages.findIndex((s) => s.id === step.stage);

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => {
      if (index >= last) setPlaying(false);
      else setIndex((i) => i + 1);
    }, STEP_MS);
    return () => window.clearTimeout(id);
  }, [playing, index, last]);

  const go = (i: number) => {
    setPlaying(false);
    setIndex(Math.min(last, Math.max(0, i)));
  };

  return (
    <div>
      {demo.kind === "illustrative" ? (
        <p className="mb-6 max-w-2xl rounded-md border border-violet/50 bg-surface px-4 py-3 text-sm text-ink-muted">
          <strong className="font-medium text-ink">
            {demo.source ? "Real code, example values." : "Illustrative example."}
          </strong>{" "}
          {demo.source ? (
            <>
              {demo.source.note} Code is copied from the{" "}
              <a
                href={`${demo.source.repoUrl}/tree/${demo.source.commit}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet underline hover:text-cyan"
              >
                repository at commit {demo.source.commit.slice(0, 7)}
              </a>
              .
            </>
          ) : (
            "The values below are made up to show the flow. They are not real output from the model."
          )}
        </p>
      ) : (
        demo.source && (
          <p className="mb-6 max-w-2xl rounded-md border border-cyan/40 bg-surface px-4 py-3 text-sm text-ink-muted">
            <strong className="font-medium text-ink">Real code, real numbers.</strong>{" "}
            {demo.source.note} Code is copied from the{" "}
            <a
              href={`${demo.source.repoUrl}/tree/${demo.source.commit}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet underline hover:text-cyan"
            >
              repository at commit {demo.source.commit.slice(0, 7)}
            </a>
            .
          </p>
        )
      )}

      <StageMap
        stages={demo.stages}
        active={activeStage}
        onSelect={(stageIndex) => {
          const first = demo.steps.findIndex((st) => st.stage === demo.stages[stageIndex].id);
          if (first >= 0) go(first);
        }}
      />

      <Card className="mt-6">
        <p className="text-sm text-ink-muted">
          Step {index + 1} of {demo.steps.length}
        </p>
        <div aria-live="polite" className="mt-2 grid gap-8 md:grid-cols-2">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-semibold">{step.title}</h3>
            <p className="mt-3 text-ink-muted">{step.text}</p>
            {step.why && (
              <p className="mt-4 border-l-2 border-violet pl-4 text-sm text-ink-muted">
                <span className="font-medium text-ink">Why: </span>
                {step.why}
              </p>
            )}
          </div>

          <div className="min-w-0">
            {step.visual === "network" && <NetworkDrawing />}
            {step.visual === "chart" && step.chart && <LossChart chart={step.chart} />}
            {step.rows && (
              <dl
                className={`divide-y divide-line rounded-md border border-line font-mono text-sm ${step.visual === "none" ? "" : "mt-6"}`}
              >
                {step.rows.map((r) => (
                  <div key={r.label} className="flex flex-wrap justify-between gap-x-4 px-3 py-2">
                    <dt className="text-ink-muted">{r.label}</dt>
                    <dd className="text-ink">{r.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
        {step.code && step.code.length > 0 && (
          <div className="mt-8 grid gap-4">
            <h4 className="text-sm font-medium">The code behind this step</h4>
            {step.code.map((c) => (
              <CodeBlock key={`${c.file}-${c.lines?.join("-") ?? "nb"}`} snippet={c} />
            ))}
          </div>
        )}
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-sm hover:border-violet disabled:opacity-40"
        >
          <ChevronLeft size={16} aria-hidden="true" /> Back
        </button>
        <button
          type="button"
          onClick={() => {
            if (playing) setPlaying(false);
            else {
              if (index >= last) setIndex(0);
              setPlaying(true);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-violet px-4 py-2 text-sm font-medium text-space hover:bg-cyan"
        >
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          {playing ? "Pause" : index >= last ? "Replay" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === last}
          className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-sm hover:border-violet disabled:opacity-40"
        >
          Next <ChevronRight size={16} aria-hidden="true" />
        </button>

        <ul aria-label="Jump to step" className="ml-auto flex gap-1.5">
          {demo.steps.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={i === index ? "step" : undefined}
                className={`h-2.5 w-2.5 rounded-full ${i === index ? "bg-violet" : "bg-line hover:bg-violet"}`}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
