import type { DemoChart } from "@/data/demos";

const W = 460;
const H = 220;
const PAD = { l: 52, r: 14, t: 30, b: 34 };

function nice(v: number) {
  return (v / 1e9).toFixed(1);
}

// A plain line chart drawn to scale from the recorded values. Only the endpoints are
// labelled, so every label names a number the chart actually reaches.
export default function LossChart({ chart }: { chart: DemoChart }) {
  const xs = chart.points.map((p) => p[0]);
  const ys = chart.points.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const sx = (x: number) => PAD.l + ((x - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => PAD.t + (1 - (y - y0) / (y1 - y0)) * (H - PAD.t - PAD.b);
  const d = chart.points.map(([x, y], i) => `${i ? "L" : "M"}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`).join(" ");
  const first = chart.points[0];
  const last = chart.points[chart.points.length - 1];

  return (
    <figure>
      <figcaption className="mb-2 text-sm font-medium">{chart.title}</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${chart.title}: falls from ${nice(first[1])} to ${nice(last[1])} billion over ${last[0]} epochs.`}
        className="h-auto w-full max-w-md"
      >
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--color-line)" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--color-line)" />
        <path d={d} fill="none" stroke="var(--color-violet)" strokeWidth={2} strokeLinejoin="round" />
        <circle cx={sx(first[0])} cy={sy(first[1])} r={3.5} fill="var(--color-ink)" />
        <circle cx={sx(last[0])} cy={sy(last[1])} r={3.5} fill="var(--color-ink)" />
        <g fontSize={11} fill="var(--color-ink-muted)">
          <text x={PAD.l - 8} y={sy(y1) + 4} textAnchor="end">{nice(y1)}</text>
          <text x={PAD.l - 8} y={sy(y0) + 4} textAnchor="end">{nice(y0)}</text>
          <text x={sx(x0)} y={H - PAD.b + 16} textAnchor="start">{x0}</text>
          <text x={sx(x1)} y={H - PAD.b + 16} textAnchor="end">{x1}</text>
          <text x={(PAD.l + W - PAD.r) / 2} y={H - 4} textAnchor="middle">{chart.xLabel}</text>
          <text x={4} y={12} textAnchor="start">{chart.yLabel}</text>
        </g>
      </svg>
      <p className="mt-2 text-xs text-ink-muted">{chart.note}</p>
    </figure>
  );
}
