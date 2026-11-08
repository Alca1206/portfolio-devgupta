// The recorded PaperPilot run shown in the Playground (public/ml/paperpilot-demo.json),
// made by scripts/export_paperpilot_demo.py. Scores are real cosine similarities from the
// embedding model; this file only validates the data and ranks chunks, it never invents values.

export type DemoChunk = { id: string; page: number; text: string };

export type RecordedAnswer = {
  text: string;
  status: "ok" | "no_relevant_chunks" | "model_said_not_found" | "no_citations" | "invalid_citations";
  best_score: number | null;
  citations: { number: number; chunk_id: string; page: number }[];
  invalid_citations: number[];
};

export type DemoQuestion = {
  text: string;
  kind: "paper" | "off-topic";
  /** Similarity of every chunk to this question, in chunk order. */
  scores: number[];
  answer: RecordedAnswer | null;
};

export type PaperPilotDemo = {
  version: 1;
  paper: { name: string; pages: number; credit?: string; repo_commit?: string; sha256?: string };
  settings: {
    chunk_max_chars: number;
    chunk_overlap_sentences: number;
    top_k: number;
    min_score: number;
    chat_model: string;
    embedding_model: string;
  };
  chunks: DemoChunk[];
  questions: DemoQuestion[];
};

export class DemoDataError extends Error {}

export function validateDemo(raw: unknown): PaperPilotDemo {
  const d = raw as PaperPilotDemo;
  const fail = (m: string): never => {
    throw new DemoDataError(`The PaperPilot demo data is invalid: ${m}`);
  };
  if (!d || d.version !== 1) fail("unknown version");
  if (!Array.isArray(d.chunks) || d.chunks.length === 0) fail("no chunks");
  if (!Array.isArray(d.questions) || d.questions.length === 0) fail("no questions");
  if (!(d.settings?.top_k >= 1) || typeof d.settings.min_score !== "number") fail("missing settings");
  for (const c of d.chunks) if (!c.id || !(c.page >= 1) || !c.text) fail("bad chunk");
  for (const q of d.questions) {
    if (!q.text || (q.kind !== "paper" && q.kind !== "off-topic")) fail("bad question");
    if (!Array.isArray(q.scores) || q.scores.length !== d.chunks.length) fail(`scores of "${q.text}" do not match the chunks`);
    if (q.scores.some((s) => typeof s !== "number" || !Number.isFinite(s) || s < -1 || s > 1)) fail("score out of range");
  }
  return d;
}

export type Ranked = { chunk: DemoChunk; score: number };

/** The topK chunks for a question, best first (what the vector search returns). */
export function topChunks(demo: PaperPilotDemo, q: DemoQuestion, topK = demo.settings.top_k): Ranked[] {
  return demo.chunks
    .map((chunk, i) => ({ chunk, score: q.scores[i] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/** Gate 1: refuse when the best chunk scores below the threshold. */
export function passesGate1(best: number | undefined, threshold: number): boolean {
  return best !== undefined && !(best < threshold);
}
