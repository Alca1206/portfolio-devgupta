// Code copied from the PaperPilot repository at a fixed commit, so the demo shows real lines.
// (Generated from the repo by a script; the line numbers refer to that commit.)
import type { CodeSnippet } from "./house-price-source.ts";

export const PAPERPILOT_REPO = "https://github.com/Alca1206/PaperPilot";
export const PAPERPILOT_COMMIT = "e982acde91ab54463d2f727a1ee90943d94ad697";

export const uploadCode: CodeSnippet = {
  file: "paperpilot/ui/paper_view.py",
  lines: [52, 54],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "    uploaded_files = st.file_uploader(\n        \"Upload research papers (PDF)\", type=[\"pdf\"], accept_multiple_files=True\n    )",
};

export const cleanCode: CodeSnippet = {
  file: "paperpilot/pdf_processing.py",
  lines: [32, 38],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "    text = re.sub(r\"(\\w)-\\n(\\w)\", r\"\\1\\2\", text)\n    text = re.sub(r\"\\n{2,}\", \"\\x00\", text)  # protect paragraph breaks\n    text = text.replace(\"\\n\", \" \")\n    text = text.replace(\"\\x00\", \"\\n\\n\")\n    text = re.sub(r\"[ \\t]+\", \" \", text)\n    text = re.sub(r\" ?\\n\\n ?\", \"\\n\\n\", text)\n    return text.strip()",
};

export const pagesCode: CodeSnippet = {
  file: "paperpilot/pdf_processing.py",
  lines: [70, 74],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "        pages = [\n            # PyMuPDF counts from 0; humans and citations count from 1.\n            PageText(page=index + 1, text=clean_text(page.get_text(\"text\", sort=True)))\n            for index, page in enumerate(doc)\n        ]",
};

export const chunkCode: CodeSnippet = {
  file: "paperpilot/chunking.py",
  lines: [72, 83],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "    texts: list[str] = []\n    current: list[str] = []\n    for sentence in sentences:\n        if current and len(\" \".join([*current, sentence])) > max_chars:\n            texts.append(\" \".join(current))\n            current = current[-overlap_sentences:] if overlap_sentences else []\n            # If overlap + new sentence is still too long, drop the overlap.\n            if len(\" \".join([*current, sentence])) > max_chars:\n                current = []\n        current.append(sentence)\n    if current:\n        texts.append(\" \".join(current))",
};

export const prefixCode: CodeSnippet = {
  file: "paperpilot/embeddings.py",
  lines: [19, 20],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "QUERY_PREFIX = \"task: search result | query: \"\nDOCUMENT_PREFIX = \"title: none | text: \"",
};

export const storeCode: CodeSnippet = {
  file: "paperpilot/vector_store.py",
  lines: [87, 95],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "        self._collection.upsert(\n            ids=[c.chunk_id for c in chunks],\n            embeddings=[list(e) for e in embeddings],\n            documents=[c.text for c in chunks],\n            metadatas=[{\"page\": c.page, \"source\": source_name} for c in chunks],\n        )\n        self._collection.modify(\n            metadata={\"chunk_count\": len(chunks), \"source_name\": source_name}\n        )",
};

export const cosineCode: CodeSnippet = {
  file: "paperpilot/vector_store.py",
  lines: [56, 60],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "        self._collection = client.get_or_create_collection(\n            name=name,\n            configuration={\"hnsw\": {\"space\": \"cosine\"}},  # Chroma's default is L2\n            embedding_function=None,  # we always supply our own vectors\n        )",
};

export const retrieveCode: CodeSnippet = {
  file: "paperpilot/retrieval.py",
  lines: [15, 18],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "    question = question.strip()\n    if not question:\n        raise ValueError(\"The question is empty.\")\n    return index.query(embedder.embed_query(question), top_k=top_k)",
};

export const scoreCode: CodeSnippet = {
  file: "paperpilot/vector_store.py",
  lines: [114, 114],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "            RetrievedChunk(chunk_id=cid, page=int(meta[\"page\"]), text=doc, score=1.0 - dist)",
};

export const gate1Code: CodeSnippet = {
  file: "paperpilot/qa.py",
  lines: [125, 133],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "    # GATE 1: nothing relevant enough -> don't let the model guess.\n    if best is None or best < settings.qa_min_score:\n        return Answer(\n            question=question,\n            answer=NOT_FOUND,\n            status=\"no_relevant_chunks\",\n            best_score=best,\n            retrieved=results,\n        )",
};

export const settingsCode: CodeSnippet = {
  file: "paperpilot/config.py",
  lines: [32, 33],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "DEFAULT_QA_TOP_K = 4\nDEFAULT_QA_MIN_SCORE = 0.35",
};

export const promptCode: CodeSnippet = {
  file: "paperpilot/qa.py",
  lines: [29, 36],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "SYSTEM_PROMPT = f\"\"\"You are PaperPilot, an assistant that answers questions about ONE research paper.\n\nRules:\n1. Use ONLY the numbered sources provided. Do not use outside knowledge.\n2. After every sentence that uses a source, cite it like [1] or [2][3].\n3. If the sources do not contain the answer, reply with exactly: {NOT_FOUND}\n4. Be concise: at most 4 sentences.\n5. Never invent numbers, names or results that are not in the sources.\"\"\"",
};

export const contextCode: CodeSnippet = {
  file: "paperpilot/qa.py",
  lines: [72, 76],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "def build_context(results: Sequence[RetrievedChunk]) -> str:\n    \"\"\"Number the sources [1]..[k] and label each with its page.\"\"\"\n    return \"\\n\\n\".join(\n        f\"[{i}] (page {r.page})\\n{r.text}\" for i, r in enumerate(results, start=1)\n    )",
};

export const chatCode: CodeSnippet = {
  file: "paperpilot/llm.py",
  lines: [56, 62],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "            response = self._client.chat(\n                model=self.model,\n                messages=list(messages),\n                format=format,\n                think=False,  # qwen3 would otherwise \"think\" at length before answering\n                options=options,\n            )",
};

export const gate2Code: CodeSnippet = {
  file: "paperpilot/qa.py",
  lines: [137, 153],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "    # GATE 2: check the model's work.\n    if is_not_found(reply):\n        return Answer(\n            question=question,\n            answer=NOT_FOUND,\n            status=\"model_said_not_found\",\n            best_score=best,\n            retrieved=results,\n        )\n\n    citations, invalid = extract_citations(reply, results)\n    if invalid:\n        status: AnswerStatus = \"invalid_citations\"\n    elif not citations:\n        status = \"no_citations\"\n    else:\n        status = \"ok\"",
};

export const citeCode: CodeSnippet = {
  file: "paperpilot/qa.py",
  lines: [94, 106],
  repo: PAPERPILOT_REPO,
  commit: PAPERPILOT_COMMIT,
  code: "    valid = sorted(n for n in numbers if 1 <= n <= len(results))\n    invalid = sorted(n for n in numbers if n not in valid)\n    citations = [\n        Citation(\n            number=n,\n            chunk_id=results[n - 1].chunk_id,  # [1] is list index 0\n            page=results[n - 1].page,\n            text=results[n - 1].text,\n            score=results[n - 1].score,\n        )\n        for n in valid\n    ]\n    return citations, invalid",
};

