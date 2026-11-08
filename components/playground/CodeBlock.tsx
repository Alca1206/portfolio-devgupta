import { ArrowUpRight } from "lucide-react";
import { snippetUrl, type CodeSnippet } from "@/data/house-price-source";

// Real code from the repository, with its file name, line numbers and a link to the
// exact lines on GitHub. Long lines scroll sideways inside the box.
export default function CodeBlock({ snippet }: { snippet: CodeSnippet }) {
  const lines = snippet.code.split("\n");
  const first = snippet.lines ? snippet.lines[0] : null;
  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-line bg-space">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2 text-xs text-ink-muted">
        <span className="font-mono">
          {snippet.file}
          {snippet.lines && (snippet.lines[0] === snippet.lines[1] ? `:${snippet.lines[0]}` : `:${snippet.lines[0]}–${snippet.lines[1]}`)}
        </span>
        <a
          href={snippetUrl(snippet)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-violet hover:text-cyan"
        >
          View on GitHub <ArrowUpRight size={12} aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      <pre className="m-0 overflow-x-auto p-3 font-mono text-[13px] leading-6 text-ink">
        <code>
          {lines.map((line, i) => (
            <span key={i} className="flex">
              {first !== null && (
                <span aria-hidden="true" className="mr-4 w-6 shrink-0 select-none text-right text-ink-muted">
                  {first + i}
                </span>
              )}
              <span className="whitespace-pre">{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
