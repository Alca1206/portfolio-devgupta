"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// A simplified drawing of a feedforward network: values travel from the inputs on the
// left to the single output on the right, one layer at a time. The node counts are
// for illustration only and are not the real layer sizes.
const LAYERS = [5, 4, 4, 1];
const QUERY = "(prefers-reduced-motion: reduce)";
function subscribe(cb: () => void) {
  const m = window.matchMedia(QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
const W = 420;
const H = 210;

function positions() {
  return LAYERS.map((count, li) => {
    const x = 40 + (li * (W - 80)) / (LAYERS.length - 1);
    return Array.from({ length: count }, (_, i) => ({
      x,
      y: H / 2 + (i - (count - 1) / 2) * 38,
    }));
  });
}

export default function NetworkDrawing() {
  const [active, setActive] = useState(0);
  const still = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  const layers = positions();

  useEffect(() => {
    if (still) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % (LAYERS.length + 1)), 800);
    return () => window.clearInterval(id);
  }, [still]);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Simplified drawing of the neural network: 85 inputs flow through hidden layers of 64 and 32 neurons to one output."
        className="h-auto w-full max-w-md"
      >
        {layers.slice(0, -1).map((from, li) =>
          from.flatMap((a, ai) =>
            layers[li + 1].map((b, bi) => (
              <line
                key={`${li}-${ai}-${bi}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--color-line)"
                strokeWidth={1}
              />
            )),
          ),
        )}
        {layers.map((nodes, li) =>
          nodes.map((n, ni) => {
            const lit = still || li === active - 1 || (active === 0 && li === 0);
            return (
              <circle
                key={`${li}-${ni}`}
                cx={n.x}
                cy={n.y}
                r={9}
                fill={lit ? "var(--color-violet)" : "var(--color-surface)"}
                stroke={lit ? "var(--color-ink)" : "var(--color-line)"}
                strokeWidth={1.5}
                style={{ transition: "fill 0.4s" }}
              />
            );
          }),
        )}
        {["inputs (85)", "hidden (64)", "hidden (32)", "output (1)"].map((t, i) => (
          <text
            key={i}
            x={layers[i][0].x}
            y={H - 4}
            textAnchor="middle"
            fontSize={11}
            fill="var(--color-ink-muted)"
          >
            {t}
          </text>
        ))}
      </svg>
      <figcaption className="mt-2 text-xs text-ink-muted">
        Simplified drawing: each circle stands for many neurons. Real sizes: 85 → 64 → 32 → 1.
      </figcaption>
    </figure>
  );
}
