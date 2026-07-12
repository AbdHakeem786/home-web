import { useRef, useState } from "react";
import { formatPKR } from "../../lib/utils";

interface RevenuePoint {
  date: string; // YYYY-MM-DD
  revenue: number;
}

const WIDTH = 600;
const HEIGHT = 200;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const PAD_X = 8;

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export default function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const n = data.length;

  const xAt = (i: number) => PAD_X + (n <= 1 ? plotWidth / 2 : (i / (n - 1)) * plotWidth);
  const yAt = (v: number) => PAD_TOP + plotHeight - (v / max) * plotHeight;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(d.revenue)}`).join(" ");
  const areaPath = `${linePath} L ${xAt(n - 1)} ${PAD_TOP + plotHeight} L ${xAt(0)} ${PAD_TOP + plotHeight} Z`;

  const total = data.reduce((sum, d) => sum + d.revenue, 0);
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = n <= 1 ? 0 : (relX - PAD_X) / plotWidth;
    const idx = Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1))));
    setHoverIndex(idx);
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-sm font-semibold text-ink">Revenue trend</h2>
          <p className="text-xs text-ink-muted">Last {n} days</p>
        </div>
        <p className="font-display text-lg font-bold text-ink">{formatPKR(total)}</p>
      </div>

      {n === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">No booking activity yet.</p>
      ) : (
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full touch-none"
            role="img"
            aria-label={`Revenue trend over the last ${n} days, total ${formatPKR(total)}`}
            onPointerMove={handleMove}
            onPointerLeave={() => setHoverIndex(null)}
          >
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1={PAD_X}
                x2={WIDTH - PAD_X}
                y1={PAD_TOP + plotHeight * f}
                y2={PAD_TOP + plotHeight * f}
                stroke="var(--color-border)"
                strokeWidth={1}
              />
            ))}

            <path d={areaPath} fill="var(--color-primary)" opacity={0.08} stroke="none" />
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <text x={PAD_X} y={12} className="fill-ink-muted text-[9px]">
              {formatShortDate(data[0].date)}
            </text>
            <text x={WIDTH - PAD_X} y={12} textAnchor="end" className="fill-ink-muted text-[9px]">
              {formatShortDate(data[n - 1].date)}
            </text>

            {hoverIndex !== null && (
              <>
                <line
                  x1={xAt(hoverIndex)}
                  x2={xAt(hoverIndex)}
                  y1={PAD_TOP}
                  y2={PAD_TOP + plotHeight}
                  stroke="var(--color-ink-muted)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={xAt(hoverIndex)}
                  cy={yAt(data[hoverIndex].revenue)}
                  r={4}
                  fill="var(--color-primary)"
                  stroke="white"
                  strokeWidth={2}
                />
              </>
            )}
          </svg>

          {hovered && hoverIndex !== null && (
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs shadow-sm"
              style={{ left: `${(xAt(hoverIndex) / WIDTH) * 100}%` }}
            >
              <p className="font-medium text-ink">{formatShortDate(hovered.date)}</p>
              <p className="text-ink-muted">{formatPKR(hovered.revenue)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
