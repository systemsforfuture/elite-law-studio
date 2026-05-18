interface Props {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  /** Optional: 'positive' | 'negative' für leichte Tönung. Default: neutral */
  trend?: "positive" | "negative" | "neutral";
}

/**
 * Schmale Inline-Trend-Linie für KPI-Cards. Monochrom in currentColor —
 * passt sich der Umgebung an. Kein Glow, kein Gradient, kein Tooltip:
 * eine Sparkline ist eine Erinnerung an den Verlauf, kein Chart.
 */
const Sparkline = ({
  values,
  width = 80,
  height = 24,
  className = "",
  trend = "neutral",
}: Props) => {
  if (!values || values.length < 2) {
    return (
      <svg width={width} height={height} className={className} aria-hidden>
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeDasharray="2 3"
        />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const last = values[values.length - 1];
  const lastY = height - ((last - min) / range) * (height - 2) - 1;
  const lastX = (values.length - 1) * step;

  const stroke =
    trend === "positive"
      ? "hsl(var(--status-success))"
      : trend === "negative"
        ? "hsl(var(--status-critical))"
        : "currentColor";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        opacity={0.85}
      />
      <circle cx={lastX} cy={lastY} r={1.75} fill={stroke} />
    </svg>
  );
};

export default Sparkline;
