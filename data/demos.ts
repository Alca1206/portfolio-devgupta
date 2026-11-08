// ============================================================================
// HOW-IT-WORKS DEMOS (shown in the ML Playground)
//
// A demo is a short walkthrough of what happens inside a project, step by step.
// To add one: copy an entry, change the text, save. The gallery card, the page and
// the sitemap appear by themselves. A test checks the rules below.
//
//   - slug: lowercase words with dashes, different from every other demo.
//   - projectSlug: the slug of a project in data/projects.ts. It shows as the "How it
//     works" tab on that project's Playground page.
//   - kind "recorded": every value and code line comes from the real repository
//     (set `source` to its link and commit). kind "illustrative": the example values
//     are made up to show the flow, and the page says so. An illustrative demo may still
//     have a `source`: then the code and settings are real and only the example values
//     (the paper, the scores, the answer) are made up.
//   - stage: which star on the map the comet is at. Must be one of the demo's stages.
//   - visual: "network" (layers drawing), "chart" (a line chart) or "none".
//   - rows: optional example values shown as a small table.
//   - code: optional real code, copied from the repository.
// ============================================================================

import type { CodeSnippet } from "./house-price-source.ts";
import {
  HOUSE_COMMIT,
  HOUSE_REPO,
  formCode,
  modelCode,
  postCode,
  predictCode,
  reindexCode,
  scaleCode,
  schemaCode,
  trainingCode,
  trainingLoss,
} from "./house-price-source.ts";

import {
  PAPERPILOT_COMMIT,
  PAPERPILOT_REPO,
  chatCode,
  chunkCode,
  cleanCode,
  citeCode,
  contextCode,
  cosineCode,
  gate1Code,
  gate2Code,
  pagesCode,
  prefixCode,
  promptCode,
  retrieveCode,
  scoreCode,
  settingsCode,
  storeCode,
  uploadCode,
} from "./paperpilot-source.ts";

export type { CodeSnippet };

export type DemoStage = { id: string; label: string; where: string };

export type DemoRow = { label: string; value: string };

export type DemoChart = {
  title: string;
  xLabel: string;
  yLabel: string;
  points: [number, number][];
  note: string;
};

export type DemoStep = {
  title: string;
  stage: string;
  text: string;
  /** Why it is done this way. Short, for a recruiter reading quickly. */
  why?: string;
  visual: "network" | "chart" | "none";
  rows?: DemoRow[];
  chart?: DemoChart;
  code?: CodeSnippet[];
};

export type Demo = {
  slug: string;
  title: string;
  /** The project this walkthrough belongs to (data/projects.ts). */
  projectSlug: string;
  summary: string;
  kind: "illustrative" | "recorded";
  /** Where the code and numbers come from. Required for "recorded". */
  source?: { repoUrl: string; commit: string; note: string };
  stages: DemoStage[];
  steps: DemoStep[];
};

export const demos: Demo[] = [
  {
    slug: "house-price-prediction",
    title: "House price prediction: what happens when you press Predict",
    projectSlug: "king-county-house-prices",
    summary:
      "Follow one request from the form to the price estimate, then see how the model was trained. The code and numbers come from the real repository.",
    kind: "recorded",
    source: {
      repoUrl: HOUSE_REPO,
      commit: HOUSE_COMMIT,
      note: "The example is the sample house from the project's notebook. The numbers come from running the repository's saved model on it.",
    },
    stages: [
      { id: "ui", label: "Streamlit form", where: "Front end" },
      { id: "api", label: "FastAPI", where: "Backend" },
      { id: "prep", label: "Columns + scaling", where: "Backend" },
      { id: "model", label: "Neural network", where: "PyTorch" },
      { id: "out", label: "Estimate", where: "Backend" },
      { id: "train", label: "How it was trained", where: "Notebook" },
    ],
    steps: [
      {
        title: "You enter a house's details",
        stage: "ui",
        text: "In the Streamlit app you fill in 17 details about the property and press Predict. This is the sample house from the project's notebook.",
        why: "A form is the friendliest way to give the model exactly the inputs it was trained on.",
        visual: "none",
        rows: [
          { label: "bedrooms", value: "3" },
          { label: "bathrooms", value: "2.5" },
          { label: "sqft_living", value: "2,500" },
          { label: "grade", value: "8" },
          { label: "yr_built", value: "2005" },
          { label: "zipcode", value: "98003" },
          { label: "…", value: "and 11 more fields" },
        ],
        code: [formCode],
      },
      {
        title: "The app calls the backend",
        stage: "api",
        text: "Streamlit sends the values to the FastAPI backend as a JSON request. FastAPI checks each field against a Pydantic model before anything else runs, so a missing or wrongly typed value is rejected.",
        why: "Keeping the model behind a REST API means any other app could use it, not only this one.",
        visual: "none",
        rows: [
          { label: "request", value: "POST /predict" },
          { label: "inside Docker", value: "http://api:8000" },
        ],
        code: [postCode, schemaCode],
      },
      {
        title: "17 fields become 85 columns, in training order",
        stage: "prep",
        text: "The zipcode is one-hot encoded into separate columns, and then the columns are put in exactly the order the model saw during training. Columns the house does not have are filled with 0.",
        why: "A swapped column would silently give a wrong price, with no error. The saved column list removes that risk.",
        visual: "none",
        rows: [
          { label: "numeric columns", value: "16" },
          { label: "zipcode columns", value: "69 (one-hot)" },
          { label: "this house", value: "zipcode_98003 = 1, the other 68 = 0" },
          { label: "total", value: "85 columns" },
        ],
        code: [reindexCode],
      },
      {
        title: "The numbers are scaled",
        stage: "prep",
        text: "The saved StandardScaler, fitted on the training data, subtracts each column's mean and divides by its spread. A bathroom count and a square-foot count end up on a similar scale.",
        why: "The scaler is bundled with the model, so predictions use exactly the same preprocessing as training.",
        visual: "none",
        rows: [
          { label: "bedrooms", value: "3 → −0.395" },
          { label: "bathrooms", value: "2.5 → 0.504" },
          { label: "sqft_living", value: "2,500 → 0.470" },
          { label: "yr_built", value: "2005 → 1.151" },
        ],
        code: [scaleCode],
      },
      {
        title: "The neural network computes a result",
        stage: "model",
        text: "The 85 scaled numbers pass through two hidden layers of 64 and 32 neurons. Each layer mixes its inputs and keeps only the positive results (ReLU). One output comes out the other end.",
        why: "This is the part that learned from the King County sales data during training.",
        visual: "network",
        rows: [
          { label: "layers", value: "85 → 64 → 32 → 1" },
          { label: "active in layer 1", value: "8 of 64 neurons" },
          { label: "active in layer 2", value: "24 of 32 neurons" },
        ],
        code: [modelCode],
      },
      {
        title: "The estimate comes back",
        stage: "out",
        text: "The backend returns the number as JSON and Streamlit shows it as a price. Docker Compose runs the front end and the backend together, so one command starts the whole app.",
        visual: "none",
        rows: [
          { label: "response", value: '{"predicted_price": 328846.25…}' },
          { label: "shown as", value: "$328,846.25" },
        ],
        code: [predictCode],
      },
      {
        title: "How the model learned",
        stage: "train",
        text: "The model was trained in the notebook on 80% of the sales data, with 20% held back for testing. It adjusted its weights over 3,000 passes through the data, trying to shrink the squared error.",
        why: "The loss was still falling slowly at epoch 3,000, so there may be room for longer training or tuning.",
        visual: "chart",
        chart: {
          title: "Training loss (mean squared error)",
          xLabel: "epoch",
          yLabel: "loss, billions",
          points: trainingLoss,
          note: "The vertical axis does not start at zero, so the fall looks steeper than it is: about 19% over 3,000 epochs.",
        },
        rows: [
          { label: "optimizer", value: "Adam, learning rate 0.01" },
          { label: "loss", value: "mean squared error" },
          { label: "split", value: "80% train, 20% test (random_state 42)" },
          { label: "test average error", value: "$72,511" },
          { label: "R² on the test set", value: "88.2%" },
        ],
        code: [trainingCode],
      },
    ],
  },
  {
    slug: "paperpilot-question-answering",
    title: "PaperPilot: how a question gets answered, or refused",
    projectSlug: "paperpilot",
    summary:
      "Follow a PDF from upload to a cited answer, and see why an off-topic question gets \"Not found in the paper.\" without the language model being called. The code and settings are real; the example paper, scores and answer are made up.",
    kind: "illustrative",
    source: {
      repoUrl: PAPERPILOT_REPO,
      commit: PAPERPILOT_COMMIT,
      note: "The code and the settings (800-character chunks, top 4 results, a 0.35 threshold) are real. The example paper, the similarity scores and the answer text are made up to show the flow, because the models run on your own machine and were not run for this page.",
    },
    stages: [
      { id: "read", label: "Read the PDF", where: "PyMuPDF" },
      { id: "chunk", label: "Cut into chunks", where: "Python" },
      { id: "index", label: "Embed and store", where: "Ollama + ChromaDB" },
      { id: "search", label: "Search", where: "ChromaDB" },
      { id: "gate1", label: "Relevance check", where: "Python" },
      { id: "answer", label: "Write the answer", where: "Ollama (qwen3:8b)" },
      { id: "check", label: "Check citations", where: "Python" },
    ],
    steps: [
      {
        title: "You upload a paper",
        stage: "read",
        text: "The Streamlit app takes a PDF. Everything runs on your own computer: no upload to a server, no paid API.",
        why: "Research papers can be unpublished or private, so keeping them local is a feature.",
        visual: "none",
        rows: [
          { label: "file (example)", value: "example-paper.pdf" },
          { label: "pages (example)", value: "12" },
          { label: "runs on", value: "your machine, through Ollama" },
        ],
        code: [uploadCode],
      },
      {
        title: "The text is read page by page",
        stage: "read",
        text: "PyMuPDF pulls the text out of every page. The text is then cleaned: line breaks inside a paragraph become spaces, and words split by a hyphen at the end of a line are joined. Every page keeps its page number, counted from 1.",
        why: "The page number is stored next to the text from this moment on, so a citation can always point to a real page.",
        visual: "none",
        rows: [
          { label: "page numbers", value: "start at 1, as a person counts" },
          { label: "known trade-off", value: "\"self-\\nattention\" becomes \"selfattention\"" },
        ],
        code: [pagesCode, cleanCode],
      },
      {
        title: "Each page is cut into chunks",
        stage: "chunk",
        text: "A language model cannot search a whole paper at once, so every page is split into pieces of whole sentences, at most 800 characters each. Neighbouring chunks share one sentence, so a fact on the boundary is whole in at least one chunk. A chunk never crosses a page.",
        why: "Small chunks make the search precise. Whole sentences and a shared overlap stop an answer being cut in half.",
        visual: "none",
        rows: [
          { label: "max chunk size", value: "800 characters" },
          { label: "overlap", value: "1 sentence" },
          { label: "chunk ids", value: "p4-c1, p4-c2 … (page 4, chunk 1, 2)" },
          { label: "example paper", value: "about 70 chunks (illustrative)" },
        ],
        code: [chunkCode],
      },
      {
        title: "Chunks become vectors and are stored",
        stage: "index",
        text: "The embedding model (embeddinggemma, run by Ollama) turns each chunk into a list of numbers, so that chunks with similar meaning end up close together. The vectors, the text and the page number go into ChromaDB on disk. If the same file is uploaded again, the saved index is reused and nothing is embedded twice.",
        why: "The index is named after the file's fingerprint and the settings that shape the vectors, so changing a setting never mixes old and new vectors.",
        visual: "none",
        rows: [
          { label: "embedding model", value: "embeddinggemma (via Ollama)" },
          { label: "similarity", value: "cosine" },
          { label: "stored per chunk", value: "vector, text, page, source file" },
        ],
        code: [prefixCode, storeCode, cosineCode],
      },
      {
        title: "Your question is searched for",
        stage: "search",
        text: "The question is embedded the same way as the chunks, and ChromaDB returns the 4 chunks whose vectors are closest. Each result carries its similarity score and its page number. Example question: \"What dataset did the authors use?\"",
        why: "Documents and questions go through one Embedder object, so they can never be embedded differently by mistake.",
        visual: "none",
        rows: [
          { label: "results kept", value: "top 4" },
          { label: "best match (illustrative)", value: "page 4, score 0.71" },
          { label: "next three (illustrative)", value: "0.64, 0.58, 0.52" },
        ],
        code: [retrieveCode, scoreCode],
      },
      {
        title: "Gate 1: is anything relevant at all?",
        stage: "gate1",
        text: "If even the best chunk scores below 0.35, PaperPilot answers \"Not found in the paper.\" and never calls the language model. Try an off-topic question such as \"What is the capital of France?\": its best score is far below the threshold, so it is refused here. The 0.71 for the dataset question passes.",
        why: "A language model will happily invent an answer if you ask it to. Refusing before it is called is the cheapest and most reliable guard.",
        visual: "none",
        rows: [
          { label: "threshold (real)", value: "0.35" },
          { label: "dataset question (illustrative)", value: "best 0.71 → continue" },
          { label: "capital of France (illustrative)", value: "best 0.12 → \"Not found in the paper.\"" },
          { label: "model called for the refusal?", value: "no" },
        ],
        code: [gate1Code, settingsCode],
      },
      {
        title: "The model answers from numbered sources only",
        stage: "answer",
        text: "The 4 chunks are numbered [1] to [4] with their pages and sent to qwen3:8b with strict rules: use only these sources, cite every sentence, say \"Not found in the paper.\" if the answer is missing, and never invent numbers or names. The temperature is low (0.1) so the answer stays close to the sources.",
        why: "The model sees only the paper's own text, and it has to point at it.",
        visual: "none",
        rows: [
          { label: "model", value: "qwen3:8b, temperature 0.1" },
          { label: "reply (illustrative)", value: "\"The authors trained on a public image dataset [1] and kept 20% for testing [3].\"" },
        ],
        code: [promptCode, contextCode, chatCode],
      },
      {
        title: "Gate 2: every citation is checked",
        stage: "check",
        text: "The answer is scanned for [n] markers. Each number must match one of the 4 sources it was given. The page for a citation comes from the page stored in the index, never from the model's own text. An answer that cites a source that does not exist, or cites nothing, is flagged instead of shown as fully trusted.",
        why: "The model's claim \"this is on page 4\" is not believed. The stored metadata is.",
        visual: "none",
        rows: [
          { label: "cites [1] and [3]", value: "both exist → pages 4 and 7 (illustrative)" },
          { label: "cites [9]", value: "no such source → status invalid_citations" },
          { label: "five outcomes", value: "ok, no relevant chunks, model said not found, no citations, invalid citations" },
        ],
        code: [gate2Code, citeCode],
      },
    ],
  },
];

export function getDemo(slug: string): Demo | undefined {
  return demos.find((d) => d.slug === slug);
}

export function demoForProject(projectSlug: string): Demo | undefined {
  return demos.find((d) => d.projectSlug === projectSlug);
}
