const W = 420;
const H = 400;
const PAD = { l: 62, r: 14, t: 18, b: 44 };

const money = (v: number) => `$${Math.round(v / 1000).toLocaleString("en-US")}k`;

// Price as one input varies and every other input stays as set. Drawn to scale; only the
// ends are labelled, plus the current point.
export default function PriceCurve({
  points,
  current,
  xLabel,
  plainNumbers = false,
}: {
  points: [number, number][];
  current: [number, number];
  xLabel: string;
  /** True for years, so 2005 is not written 2,005. */
  plainNumbers?: boolean;
}) {
  const xs = points.map((p) => p[0]);
  const ys = [...points.map((p) => p[1]), current[1]];
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const span = y1 - y0 || 1;
  const sx = (x: number) => PAD.l + ((x - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const sy = (y: number) => PAD.t + (1 - (y - y0) / span) * (H - PAD.t - PAD.b);
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`).join(" ");
  const num = (v: number) => (plainNumbers ? String(Math.round(v)) : v.toLocaleString("en-US"));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Price as ${xLabel} goes from ${num(x0)} to ${num(x1)}: from ${money(points[0][1])} to ${money(points[points.length - 1][1])}. Current value ${num(current[0])} gives ${money(current[1])}.`}
      className="h-auto w-full"
    >
      <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="var(--color-line)" />
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="var(--color-line)" />
      <path d={d} fill="none" stroke="var(--color-violet)" strokeWidth={2} strokeLinejoin="round" />
      <line x1={sx(current[0])} y1={PAD.t} x2={sx(current[0])} y2={H - PAD.b} stroke="var(--color-ink-muted)" strokeDasharray="3 4" />
      <circle cx={sx(current[0])} cy={sy(current[1])} r={5} fill="var(--color-ink)" stroke="var(--color-violet)" strokeWidth={2} />
      <g fontSize={13} fill="var(--color-ink-muted)">
        <text x={PAD.l - 8} y={sy(y1) + 4} textAnchor="end">{money(y1)}</text>
        <text x={PAD.l - 8} y={sy(y0) + 4} textAnchor="end">{money(y0)}</text>
        <text x={sx(x0)} y={H - PAD.b + 20} textAnchor="start">{num(x0)}</text>
        <text x={sx(x1)} y={H - PAD.b + 20} textAnchor="end">{num(x1)}</text>
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 8} textAnchor="middle">{xLabel}</text>
      </g>
    </svg>
  );
}
