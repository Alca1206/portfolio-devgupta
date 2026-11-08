"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoStage } from "@/data/demos";

// The pipeline drawn as a comet's journey. The stages are small stars scattered along an
// uneven curve; a comet with a fading tail flies from one to the next as the steps change.
// All positions are percentages of the box, so it scales to any width.

type P = { x: number; y: number };

// Deliberately uneven, so the path looks hand-placed rather than evenly spaced.
const XS = [11, 24, 35, 52, 63, 80, 89];
const YS = [54, 30, 66, 38, 72, 44, 58];
const LAUNCH: P = { x: -6, y: 40 };
const EXIT: P = { x: 106, y: 52 };

function route(count: number): P[] {
  const stars = Array.from({ length: count }, (_, i): P => {
    // spread the first `count` slots of the uneven table across the full width
    const slot = count === 1 ? 0 : Math.round((i * (XS.length - 1)) / (count - 1));
    return { x: XS[slot], y: YS[slot] };
  });
  return [LAUNCH, ...stars, EXIT];
}

// Catmull-Rom spline through the points: a smooth curve instead of straight, zig-zag lines.
function at(points: P[], u: number): P {
  const last = points.length - 1;
  const k = Math.max(0, Math.min(last - 1, Math.floor(u)));
  const t = Math.max(0, Math.min(1, u - k));
  const p0 = points[Math.max(0, k - 1)];
  const p1 = points[k];
  const p2 = points[k + 1];
  const p3 = points[Math.min(last, k + 2)];
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 *
    (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
}

// Comet colours come from the project's accent (CSS variables set on the page):
// a light head, and a tail fading from the main colour into the second one.
function tailColor(k: number): string {
  // k = 0 near the head (main colour) ... 1 at the end of the tail (second colour)
  return `color-mix(in srgb, var(--color-violet) ${Math.round((1 - k) * 100)}%, var(--color-accent2))`;
}

const TAIL_SEGMENTS = 40;
const TAIL_LENGTH = 1.5; // in "stage steps" behind the head
const DUST = [0.18, 0.37, 0.52, 0.71, 0.9];

export default function StageMap({
  stages,
  active,
  onSelect,
}: {
  stages: DemoStage[];
  active: number;
  onSelect: (stageIndex: number) => void;
}) {
  const pts = route(stages.length);
  const target = active + 1; // index 0 is the launch point
  const [u, setU] = useState(target);
  const current = useRef(target);

  // Fly the comet to the new star. A callback (not the effect body) updates the state.
  useEffect(() => {
    const from = current.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 0 : 1100;
    let start: number | null = null;
    let raf = 0;
    const tick = (now: number) => {
      if (start === null) start = now;
      const k = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      current.current = from + (target - from) * eased;
      setU(current.current);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const head = at(pts, u);
  const tail = Array.from({ length: TAIL_SEGMENTS + 1 }, (_, j) =>
    at(pts, Math.max(0, u - (j / TAIL_SEGMENTS) * TAIL_LENGTH)),
  );
  // the whole route, drawn faintly, so you can see where the comet is heading
  const route2 = Array.from({ length: (pts.length - 1) * 12 + 1 }, (_, j) => at(pts, j / 12));
  const d = route2.map((p, j) => `${j === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");

  return (
    <div className="relative h-64 w-full overflow-hidden">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      >
        <path
          d={d}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={1.2}
          strokeDasharray="2 7"
          vectorEffect="non-scaling-stroke"
        />
        {tail.slice(0, -1).map((a, j) => {
          const b = tail[j + 1];
          const k = 1 - j / TAIL_SEGMENTS; // 1 near the head, 0 at the end of the tail
          return (
            <line
              key={j}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              style={{ stroke: tailColor(1 - k) }}
              strokeLinecap="butt"
              strokeOpacity={0.04 + 0.7 * k * k}
              strokeWidth={1 + 11 * k}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {DUST.map((f, j) => {
        const q = at(pts, Math.max(0, u - f * TAIL_LENGTH));
        return (
          <span
            key={j}
            aria-hidden="true"
            className="pointer-events-none absolute h-[3px] w-[3px] rounded-full bg-ink"
            style={{
              left: `${q.x + (j % 2 ? 0.7 : -0.7)}%`,
              top: `${q.y + (j % 3 ? -4 : 5)}%`,
              opacity: 0.6 - f * 0.4,
            }}
          />
        );
      })}

      {/* the comet's head */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-14 w-14 rounded-full"
        style={{
          left: `${head.x}%`,
          top: `${head.y}%`,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, #fff 0 9%, color-mix(in srgb, #fff 70%, var(--color-violet)) 16%, var(--color-violet) 30%, color-mix(in srgb, var(--color-violet) 0%, transparent) 68%)",
        }}
      />

      <ol aria-label="Stages of the pipeline" className="m-0 list-none p-0">
        {stages.map((s, i) => {
          const p = pts[i + 1];
          const on = i === active;
          const passed = i < active;
          const above = p.y > 55; // keep labels clear of the curve
          return (
            <li
              key={s.id}
              className="absolute"
              style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
            >
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={on ? "step" : undefined}
                aria-label={`${s.label} (${s.where})`}
                className="group flex flex-col items-center focus-visible:outline-offset-8"
              >
                <span
                  className={`block rounded-full transition-all ${
                    on
                      ? "h-3 w-3 bg-ink"
                      : passed
                        ? "h-2 w-2 bg-violet"
                        : "h-2 w-2 border border-violet bg-space group-hover:bg-violet"
                  }`}
                />
                <span
                  className={`absolute w-24 text-center sm:w-32 ${
                    above ? "bottom-full mb-5" : "top-full mt-5"
                  }`}
                >
                  <span
                    className={`block text-xs font-medium sm:text-sm ${on ? "text-violet" : "text-ink-muted group-hover:text-ink"}`}
                  >
                    {s.label}
                  </span>
                  <span className="hidden text-xs text-ink-muted sm:block">{s.where}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
