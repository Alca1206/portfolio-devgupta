"""Export a real PaperPilot run for the website's Playground (the "Try it" tab).

Run it ONCE on your own computer, where Ollama is running with the two models
(`ollama pull qwen3:8b` and `ollama pull embeddinggemma`). It reads a PDF the way
PaperPilot does, embeds the chunks and your questions, and writes one JSON file:
the similarity score of EVERY chunk for EVERY question (so the page can move the
threshold live), plus the real answer, status and citations PaperPilot gave.

Usage (from the website folder):

    python scripts/export_paperpilot_demo.py --repo C:\\path\\to\\PaperPilot --pdf paper.pdf --questions scripts/paperpilot_questions.txt --credit "Li, Jones, Furber (2023), arXiv:2303.10276"

    questions.txt: one question per line about THIS paper (5 to 8 is plenty).
    Lines starting with # are ignored. Three off-topic questions are added for you.

Output: public/ml/paperpilot-demo.json  (commit it, then push)

The website shows only a short excerpt of each chunk (--snippet-chars, default 240), with
credit to the paper, so the page does not republish the paper. The similarity scores are always
computed on the FULL chunk text. Only use a paper you are allowed to quote from.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

OFF_TOPIC = [
    "What is the capital of France?",
    "Who won the 2018 football World Cup?",
    "How do I bake sourdough bread?",
]


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def read_questions(path: Path) -> list[str]:
    lines = [ln.strip() for ln in path.read_text(encoding="utf-8").splitlines()]
    return [ln for ln in lines if ln and not ln.startswith("#")]


def excerpt(text, limit):
    """The first `limit` characters (cut at a word), or the whole text when limit is 0."""
    if limit <= 0 or len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(",;:") + " …"


def build_demo(document, chunks, settings, embedder, llm, questions, with_answers, chroma_client=None, snippet_chars=240):
    """Return the JSON-ready dict. Everything is injected, so tests can pass fakes."""
    from paperpilot.indexing import index_paper, open_index
    from paperpilot.qa import answer_question

    print(f"Embedding {len(chunks)} chunks ...")
    vectors = embedder.embed_documents([c.text for c in chunks])

    index = None
    if with_answers:
        index_paper(document, chunks, settings, embedder, chroma_client)
        index = open_index(document, settings, chroma_client)

    items = []
    for kind, q in questions:
        print(f"Question ({kind}): {q}")
        qv = embedder.embed_query(q)
        scores = [round(cosine(qv, v), 4) for v in vectors]
        item = {"text": q, "kind": kind, "scores": scores, "answer": None}
        if with_answers:
            ans = answer_question(q, index, embedder, llm, settings)
            # Sanity check: our own scoring should pick the same top chunks as PaperPilot's search.
            ours = [chunks[i].chunk_id for i in sorted(range(len(chunks)), key=lambda i: -scores[i])[: settings.qa_top_k]]
            theirs = [r.chunk_id for r in ans.retrieved]
            if ours != theirs:
                print(f"  note: top-{settings.qa_top_k} order differs slightly ({ours} vs {theirs})")
            item["answer"] = {
                "text": ans.answer,
                "status": ans.status,
                "best_score": None if ans.best_score is None else round(ans.best_score, 4),
                "citations": [{"number": c.number, "chunk_id": c.chunk_id, "page": c.page} for c in ans.citations],
                "invalid_citations": list(ans.invalid_citations),
            }
        items.append(item)

    return {
        "version": 1,
        "paper": {"name": document.source_name, "pages": document.page_count},
        "settings": {
            "chunk_max_chars": settings.chunk_max_chars,
            "chunk_overlap_sentences": settings.chunk_overlap_sentences,
            "top_k": settings.qa_top_k,
            "min_score": settings.qa_min_score,
            "chat_model": settings.chat_model,
            "embedding_model": settings.embedding_model,
        },
        "chunks": [{"id": c.chunk_id, "page": c.page, "text": excerpt(c.text, snippet_chars)} for c in chunks],
        "questions": items,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--repo", required=True, help="path to your PaperPilot folder")
    ap.add_argument("--pdf", required=True, help="the paper (must be OK to republish)")
    ap.add_argument("--questions", required=True, help="text file, one question per line")
    ap.add_argument("--out", default="public/ml/paperpilot-demo.json")
    ap.add_argument("--snippet-chars", type=int, default=240, help="characters of each chunk shown on the site (0 = all)")
    ap.add_argument("--credit", default="", help="who to credit, shown on the page")
    ap.add_argument("--no-answers", action="store_true", help="skip the slow qwen3:8b answers")
    args = ap.parse_args()

    sys.path.insert(0, str(Path(args.repo).resolve()))
    try:
        from paperpilot.chunking import chunk_document
        from paperpilot.config import Settings
        from paperpilot.embeddings import Embedder
        from paperpilot.llm import LLM
        from paperpilot.pdf_processing import extract_pages
        from paperpilot.vector_store import make_chroma_client
    except ImportError as exc:
        print(f"Could not import PaperPilot from {args.repo}: {exc}")
        return 1

    settings = Settings()
    document = extract_pages(args.pdf)
    chunks = chunk_document(document, settings.chunk_max_chars, settings.chunk_overlap_sentences)
    print(f"{document.page_count} pages, {len(chunks)} chunks")

    own = read_questions(Path(args.questions))
    questions = [("paper", q) for q in own] + [("off-topic", q) for q in OFF_TOPIC]

    # A throw-away index. On Windows ChromaDB keeps its database file open until the program
    # ends, so deleting the folder can fail; that must not stop the export, so errors are ignored.
    tmp = tempfile.mkdtemp(prefix="paperpilot-export-")
    try:
        chroma = make_chroma_client(Path(tmp))
        data = build_demo(
            document, chunks, settings, Embedder(settings), LLM(settings), questions,
            with_answers=not args.no_answers, chroma_client=chroma, snippet_chars=args.snippet_chars,
        )
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    try:
        data["paper"]["repo_commit"] = subprocess.check_output(
            ["git", "-C", args.repo, "rev-parse", "HEAD"], text=True
        ).strip()
    except Exception:
        pass
    if args.credit:
        data["paper"]["credit"] = args.credit
    data["paper"]["sha256"] = hashlib.sha256(Path(args.pdf).read_bytes()).hexdigest()[:16]

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {out} ({out.stat().st_size // 1024} KB). Open it and check the excerpts, then push it.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
