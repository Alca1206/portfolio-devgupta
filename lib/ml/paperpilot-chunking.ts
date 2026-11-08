// A TypeScript port of PaperPilot's chunker (paperpilot/chunking.py), so the Playground can
// run the same algorithm in the browser. A test checks it against output produced by the
// real Python code. Lengths count characters the way Python does (code points), not UTF-16 units.

export type Page = { page: number; text: string };
export type Chunk = { id: string; page: number; text: string };

export const MIN_MAX_CHARS = 50;

const len = (s: string) => Array.from(s).length;

/** Split on whitespace that follows ., ! or ? (the punctuation is kept). */
export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Split text with no sentence breaks (references, tables, URLs) into pieces of at most maxChars. */
export function splitLongPiece(piece: string, maxChars: number): string[] {
  const words: string[] = [];
  for (const word of piece.split(/\s+/).filter(Boolean)) {
    const chars = Array.from(word);
    for (let i = 0; i < chars.length; i += maxChars) words.push(chars.slice(i, i + maxChars).join(""));
  }
  const pieces: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = `${current} ${word}`.trim();
    if (len(candidate) > maxChars && current) {
      pieces.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

export function chunkPage(page: Page, maxChars = 800, overlapSentences = 1): Chunk[] {
  if (maxChars < MIN_MAX_CHARS) throw new RangeError(`maxChars must be at least ${MIN_MAX_CHARS}, got ${maxChars}`);
  if (overlapSentences < 0) throw new RangeError(`overlapSentences must be >= 0, got ${overlapSentences}`);

  const sentences: string[] = [];
  for (const s of splitIntoSentences(page.text)) {
    if (len(s) > maxChars) sentences.push(...splitLongPiece(s, maxChars));
    else sentences.push(s);
  }

  const texts: string[] = [];
  let current: string[] = [];
  for (const sentence of sentences) {
    if (current.length && len([...current, sentence].join(" ")) > maxChars) {
      texts.push(current.join(" "));
      current = overlapSentences ? current.slice(-overlapSentences) : [];
      // If overlap + new sentence is still too long, drop the overlap.
      if (len([...current, sentence].join(" ")) > maxChars) current = [];
    }
    current.push(sentence);
  }
  if (current.length) texts.push(current.join(" "));

  return texts.map((text, i) => ({ id: `p${page.page}-c${i + 1}`, page: page.page, text }));
}

/** Chunk every page and drop tiny junk chunks (e.g. a lone page number). */
export function chunkDocument(pages: Page[], maxChars = 800, overlapSentences = 1, minChunkChars = 30): Chunk[] {
  const out: Chunk[] = [];
  for (const p of pages) for (const c of chunkPage(p, maxChars, overlapSentences)) if (len(c.text) >= minChunkChars) out.push(c);
  return out;
}

export const charCount = len;
