type Props = {
  label: string;
  /** Output of each neuron for the house being tried (0 means off). */
  values: number[];
  /** Average output of each neuron over every house in the training data. */
  average: number[];
  /** How many neurons fire for a typical house. */
  typical: number;
};

const W = 640;
const H = 250;

// One thin bar per neuron. The lilac bar is this house; the dark bar behind it is the
// average over all houses, so you can see which neurons are unusually active. Heights use a
// square-root scale (so small values stay visible) and the same scale for both bars.
export default function NeuronBars({ label, values, average, typical }: Props) {
  const n = values.length;
  const max = Math.max(...values, ...average, 1e-9);
  const h = (v: number) => (v <= 0 ? 0 : (H - 4) * Math.sqrt(v / max));
  const slot = W / n;
  const firing = values.filter((v) => v > 0).length;

  return (
    <div>
      <p className="mb-1 text-sm">
        <span className="font-medium">{label}</span>{" "}
        <span className="text-ink-muted">
          {firing} of {n} firing · a typical house: {typical.toFixed(0)}
        </span>
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label}: ${firing} of ${n} neurons firing for this house, compared with ${typical.toFixed(0)} for a typical house.`}
        className="h-auto w-full"
      >
        <line x1={0} y1={H - 1} x2={W} y2={H - 1} stroke="var(--color-line)" />
        {values.map((v, i) => (
          <g key={i}>
            <title>{`Neuron ${i + 1}: ${v.toFixed(2)} (average ${average[i].toFixed(2)})`}</title>
            <rect
              x={i * slot + slot * 0.12}
              y={H - 1 - h(average[i])}
              width={slot * 0.76}
              height={h(average[i])}
              fill="var(--color-line)"
            />
            {v > 0 && (
              <rect
                x={i * slot + slot * 0.3}
                y={H - 1 - h(v)}
                width={slot * 0.4}
                height={h(v)}
                fill="var(--color-violet)"
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
