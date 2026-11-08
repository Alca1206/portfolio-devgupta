"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import Card from "@/components/ui/Card";
import {
  DemoDataError,
  passesGate1,
  topChunks,
  validateDemo,
  type PaperPilotDemo,
} from "@/lib/ml/paperpilot-demo";
import { chunkDocument, charCount, splitIntoSentences, MIN_MAX_CHARS } from "@/lib/ml/paperpilot-chunking";

const DATA_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/ml/paperpilot-demo.json`;

// The real defaults from PaperPilot's settings (paperpilot/config.py).
const REAL_MAX = 800;
const REAL_OVERLAP = 1;

// Made-up sample text, so nothing here is copied from a real paper.
const SAMPLE = `Seeds need water to wake up. In our trays, the seeds that were watered every morning sprouted within four days. Seeds that were watered only twice a week took nearly nine days, and about one in five never sprouted at all. We therefore treat water as the main factor. Warm soil also helps: at twenty degrees the median seed sprouted a day earlier than at twelve degrees. Cold soil slows germination down, but it did not stop it. The trays were kept in the same room, so air temperature stayed almost constant. Only the heating mat under each tray was changed. We checked the mats with a thermometer before every run. Two of the mats drifted by about one degree, so we replaced them after the first week. Each tray was labelled, photographed and weighed at the same time every morning. The scale was accurate to one gram, which was enough to see how much water each tray had lost overnight.
---
Light mattered less than we expected. Seeds kept in the dark sprouted almost as fast as seeds under a lamp, which is common for the species we used. The difference only became clear after sprouting, when the seedlings in the dark grew long, pale stems. We measured the stems with a ruler every second day. The measurements were noisy, so we report medians instead of averages. Each tray held forty seeds. We ran every setting three times. Between runs the trays were washed and the soil was replaced. We did not reuse any soil, because leftover roots could change how fast the next seeds sprouted. In total we counted more than two thousand seeds across all runs, and every count was done by two people independently.
---
Limitations. We tested a single plant species, and the trays were small. Results may differ outdoors, where rain, wind and insects add noise. We also did not test different soils. A larger study with several species and soil types would show whether water is the main factor everywhere or only here.`;

const sentenceCount = (s: string) => splitIntoSentences(s).length;

type Load = { demo: PaperPilotDemo } | "missing" | { error: string } | null;

export default function PaperPilotLab() {
  return (
    <div className="grid gap-5">
      <ChunkLab />
      <GateLab />
    </div>
  );
}

// ---------------------------------------------------------------- chunking -----------------

function ChunkLab() {
  const [text, setText] = useState(SAMPLE);
  const [maxChars, setMaxChars] = useState(REAL_MAX);
  const [overlap, setOverlap] = useState(REAL_OVERLAP);

  const pages = useMemo(
    () =>
      text
        .split(/^\s*---\s*$/m)
        .map((t, i) => ({ page: i + 1, text: t.trim() }))
        .filter((p) => p.text.length > 0),
    [text],
  );
  const chunks = useMemo(() => chunkDocument(pages, maxChars, overlap), [pages, maxChars, overlap]);
  const changed = maxChars !== REAL_MAX || overlap !== REAL_OVERLAP;

  return (
    <Card className="!p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">1. Cutting a paper into chunks</h2>
        <button
          type="button"
          onClick={() => {
            setText(SAMPLE);
            setMaxChars(REAL_MAX);
            setOverlap(REAL_OVERLAP);
          }}
          className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs hover:border-violet"
        >
          <RotateCcw size={12} aria-hidden="true" /> Reset
        </button>
      </div>
      <p className="mt-1 max-w-3xl text-sm text-ink-muted">
        This runs PaperPilot&apos;s real chunking algorithm (ported to TypeScript and tested against the
        Python code). Edit the text, or paste your own; put a line with only <code className="font-mono">---</code>{" "}
        between pages. The sample text is made up.
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="grid content-start gap-4">
          <label className="grid gap-1 text-sm">
            <span className="text-ink-muted">Paper text</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              className="w-full resize-y rounded-md border border-line bg-space p-3 font-mono text-[13px] leading-6 text-ink"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="flex justify-between text-ink-muted">
              Largest chunk <span className="font-mono text-ink">{maxChars} characters</span>
            </span>
            <input
              type="range"
              min={MIN_MAX_CHARS}
              max={1500}
              step={10}
              value={maxChars}
              onChange={(e) => setMaxChars(Number(e.target.value))}
              className="accent-[var(--color-violet)]"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="flex justify-between text-ink-muted">
              Shared sentences between chunks <span className="font-mono text-ink">{overlap}</span>
            </span>
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={overlap}
              onChange={(e) => setOverlap(Number(e.target.value))}
              className="accent-[var(--color-violet)]"
            />
          </label>
          <p className="text-xs text-ink-muted">
            PaperPilot&apos;s real settings are {REAL_MAX} characters and {REAL_OVERLAP} shared sentence.
            {changed ? " You have changed them." : ""}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-sm text-ink-muted" aria-live="polite">
            {pages.length} page{pages.length === 1 ? "" : "s"} → <span className="font-mono text-ink">{chunks.length}</span>{" "}
            chunk{chunks.length === 1 ? "" : "s"}. A chunk never crosses a page.
          </p>
          <ol className="mt-3 grid max-h-[30rem] gap-2 overflow-y-auto pr-1">
            {chunks.map((c) => {
              const sentences = splitIntoSentences(c.text);
              const shared = Math.min(overlap, sentences.length - 1);
              const prev = chunks[chunks.indexOf(c) - 1];
              const hasShared = overlap > 0 && prev && prev.page === c.page && shared > 0 && sentenceCount(prev.text) > 0;
              const head = hasShared ? sentences.slice(0, shared).join(" ") : "";
              const sharedOk = hasShared && prev.text.endsWith(head);
              return (
                <li key={c.id} className="rounded-md border border-line bg-space p-3">
                  <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
                    <span className="font-mono text-ink">
                      {c.id} <span className="text-ink-muted">· page {c.page}</span>
                    </span>
                    <span className="font-mono">
                      {charCount(c.text)} / {maxChars}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 rounded bg-line" aria-hidden="true">
                    <div
                      className="h-1 rounded bg-violet"
                      style={{ width: `${Math.min(100, (charCount(c.text) / maxChars) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">
                    {sharedOk ? (
                      <>
                        <mark className="rounded bg-violet/25 px-0.5 text-ink" title="Also the end of the previous chunk">
                          {head}
                        </mark>
                        {c.text.slice(head.length)}
                      </>
                    ) : (
                      c.text
                    )}
                  </p>
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-xs text-ink-muted">
            <mark className="rounded bg-violet/25 px-0.5 text-ink">Highlighted</mark> sentences are shared with the
            chunk before, so a fact on a boundary is whole in at least one chunk.
          </p>
        </div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------ refusal gate -----------------

function GateLab() {
  const [load, setLoad] = useState<Load>(null);
  const [selected, setSelected] = useState(0);
  const [threshold, setThreshold] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(DATA_URL, { signal: controller.signal })
      .then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new DemoDataError(`The recorded run could not be loaded (${res.status}).`);
        return res.json();
      })
      .then((json) => {
        if (json === null) return setLoad("missing");
        const demo = validateDemo(json);
        setLoad({ demo });
        setThreshold(demo.settings.min_score);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoad({ error: err instanceof DemoDataError ? err.message : "The recorded run could not be downloaded." });
      });
    return () => controller.abort();
  }, []);

  if (load === null || load === "missing") return null; // the recorded run is added separately
  if ("error" in load) {
    return (
      <p role="alert" className="text-sm text-ink-muted">
        {load.error}
      </p>
    );
  }
  const { demo } = load;
  const t = threshold ?? demo.settings.min_score;
  const q = demo.questions[Math.min(selected, demo.questions.length - 1)];
  const top = topChunks(demo, q);
  const best = top[0]?.score;
  const passes = passesGate1(best, t);
  const recordedAtRealThreshold = q.answer && t === demo.settings.min_score;
  const realPasses = passesGate1(best, demo.settings.min_score);

  return (
    <Card className="!p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">2. Answer or refuse?</h2>
        <button
          type="button"
          onClick={() => setThreshold(demo.settings.min_score)}
          className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs hover:border-violet"
        >
          <RotateCcw size={12} aria-hidden="true" /> Reset threshold
        </button>
      </div>
      <p className="mt-1 max-w-3xl text-sm text-ink-muted">
        A real run of PaperPilot on <span className="text-ink">{demo.paper.name}</span>
        {demo.paper.credit ? <> ({demo.paper.credit})</> : null} ({demo.paper.pages} pages, {demo.chunks.length} chunks). The similarity scores come from the real embedding model (
        {demo.settings.embedding_model}), and the answers from {demo.settings.chat_model}. Pick a question and move
        the threshold to see when PaperPilot would refuse. Chunk texts are shortened here; the scores were computed on
        the full text.
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="grid content-start gap-4">
          <label className="grid gap-1 text-sm">
            <span className="flex justify-between text-ink-muted">
              Threshold <span className="font-mono text-ink">{t.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={t}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="accent-[var(--color-violet)]"
            />
            <span className="text-xs text-ink-muted">PaperPilot&apos;s real threshold is {demo.settings.min_score.toFixed(2)}.</span>
          </label>

          <fieldset className="grid gap-1.5">
            <legend className="mb-1 text-sm text-ink-muted">Question (best chunk score)</legend>
            {demo.questions.map((qq, i) => {
              const b = Math.max(...qq.scores);
              const ok = passesGate1(b, t);
              return (
                <label
                  key={qq.text}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-2.5 text-sm ${
                    i === selected ? "border-violet bg-space" : "border-line hover:border-violet/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="pp-question"
                    checked={i === selected}
                    onChange={() => setSelected(i)}
                    className="mt-1 accent-[var(--color-violet)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block">{qq.text}</span>
                    <span className="mt-1.5 flex items-center gap-2 text-xs text-ink-muted">
                      <span className="relative h-1.5 flex-1 rounded bg-line" aria-hidden="true">
                        <span className="absolute inset-y-0 left-0 rounded bg-violet" style={{ width: `${Math.max(0, b) * 100}%` }} />
                        <span className="absolute -inset-y-1 w-px bg-ink" style={{ left: `${t * 100}%` }} />
                      </span>
                      <span className="font-mono text-ink">{b.toFixed(2)}</span>
                      <span className={ok ? "text-ink" : "text-ink-muted"}>{ok ? "answers" : "refused"}</span>
                    </span>
                    {qq.kind === "off-topic" && <span className="mt-1 block text-xs text-ink-muted">off-topic</span>}
                  </span>
                </label>
              );
            })}
          </fieldset>
        </div>

        <div className="min-w-0">
          <p className="text-sm">
            <span className="font-medium">Gate 1:</span>{" "}
            <span className="text-ink-muted">
              best score <span className="font-mono text-ink">{best?.toFixed(2)}</span> {passes ? "≥" : "<"}{" "}
              <span className="font-mono text-ink">{t.toFixed(2)}</span>
            </span>
          </p>
          <p
            className={`mt-2 rounded-md border px-3 py-2 text-sm ${passes ? "border-line" : "border-violet/60"}`}
            aria-live="polite"
          >
            {passes ? (
              <>The model is called with the top {demo.settings.top_k} chunks as numbered sources.</>
            ) : (
              <>
                <strong className="font-medium">Not found in the paper.</strong> The language model is never called.
              </>
            )}
          </p>

          {passes && (
            <div className="mt-3 text-sm">
              {recordedAtRealThreshold && q.answer ? (
                <>
                  <p className="text-ink-muted">
                    What {demo.settings.chat_model} really answered (status{" "}
                    <span className="font-mono text-ink">{q.answer.status}</span>):
                  </p>
                  <p className="mt-1 rounded-md border border-line bg-space p-3 leading-relaxed">{q.answer.text}</p>
                  {q.answer.citations.length > 0 && (
                    <p className="mt-1 text-xs text-ink-muted">
                      Citations checked against the sources:{" "}
                      {q.answer.citations.map((c) => `[${c.number}] page ${c.page}`).join(", ")}
                    </p>
                  )}
                </>
              ) : realPasses && q.answer ? (
                <p className="text-ink-muted">
                  The real answer was recorded at the real threshold. Reset the threshold to see it.
                </p>
              ) : (
                <p className="text-ink-muted">
                  At the real threshold ({demo.settings.min_score.toFixed(2)}) this question is refused, so no answer was
                  recorded for it. With your lower threshold the model would be called, but I did not run it.
                </p>
              )}
            </div>
          )}

          <h3 className="mt-5 text-sm font-medium">Top {demo.settings.top_k} chunks the search found</h3>
          <ol className="mt-2 grid gap-2">
            {top.map((r, i) => (
              <li key={r.chunk.id} className="rounded-md border border-line bg-space p-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono">
                    [{i + 1}] {r.chunk.id} <span className="text-ink-muted">· page {r.chunk.page}</span>
                  </span>
                  <span className="font-mono text-ink">{r.score.toFixed(2)}</span>
                </div>
                <div className="mt-1.5 h-1 rounded bg-line" aria-hidden="true">
                  <div className="h-1 rounded bg-violet" style={{ width: `${Math.max(0, r.score) * 100}%` }} />
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{r.chunk.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  );
}
