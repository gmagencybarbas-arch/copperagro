"use client";

import { formatBRL } from "@/lib/format";
import type { WeekPoint } from "@/lib/analytics-charts-data";
import { useCallback, useId, useMemo, useState } from "react";
import { AN } from "./analytics-tokens";

const W = 800;
const H = 320;
const PAD = { l: 48, r: 20, t: 24, b: 44 };

type Props = {
  data: WeekPoint[];
  title?: string;
  /** Subtítulo (ex.: contexto de modo) */
  subtitle?: string;
};

function pathFor(
  points: { x: number; y: number }[],
  closeBottom: boolean,
  bottom: number,
): string {
  if (points.length < 2) return "";
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  if (!closeBottom) return line;
  const last = points[points.length - 1]!;
  const first = points[0]!;
  return `${line} L${last.x},${bottom} L${first.x},${bottom} Z`;
}

type TrendHint = { label: string; up: boolean };

function profitTrendFromSeries(data: WeekPoint[]): TrendHint | null {
  if (data.length < 2) return null;
  const n = data.length;
  const last = data[n - 1]!.profit;
  const prev = data[n - 2]!.profit;
  if (n >= 3) {
    const a = data[n - 3]!.profit;
    if (last > prev && prev > a) return { label: "Alta consistente", up: true };
    if (last < prev && prev < a) return { label: "Queda consistente", up: false };
  }
  if (last > prev * 1.02) return { label: "Alta recente", up: true };
  if (last < prev * 0.98) return { label: "Queda recente", up: false };
  return { label: "Tendência estável", up: true };
}

export function MainChart({ data, title = "História semanal", subtitle }: Props) {
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<{
    i: number;
    x: number;
    y: number;
  } | null>(null);

  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const bottomY = H - PAD.b;

  const trendHint = useMemo(() => profitTrendFromSeries(data), [data]);

  const paths = useMemo(() => {
    if (data.length < 1) {
      return null;
    }
    const minRaw = Math.min(0, ...data.map((d) => d.profit));
    const maxRaw = Math.max(
      1,
      ...data.map((d) => Math.max(d.revenue, d.expenses, d.profit)),
    );
    const minVal = minRaw;
    const maxVal = maxRaw;
    const r = maxVal - minVal || 1;
    const n = data.length;
    const scaleX = (i: number) => PAD.l + (i / Math.max(1, n - 1)) * innerW;
    const scaleY = (v: number) => PAD.t + innerH - ((v - minVal) / r) * innerH;
    const rev = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.revenue) }));
    const exp = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.expenses) }));
    const pro = data.map((d, i) => ({ x: scaleX(i), y: scaleY(d.profit) }));
    return { rev, exp, pro, minVal, maxVal, scaleX, lastPro: pro[pro.length - 1]! };
  }, [data, innerH, innerW]);

  const dRev = paths ? pathFor(paths.rev, false, 0) : "";
  const dExp = paths ? pathFor(paths.exp, false, 0) : "";
  const dPro = paths ? pathFor(paths.pro, false, 0) : "";
  /** Área de lucro até a linha de zero (escala com lucros negativos) */
  const dProAreaUse = useMemo(() => {
    if (!paths || data.length < 1) return "";
    const { pro, minVal, maxVal } = paths;
    if (pro.length < 2) return "";
    const r = maxVal - minVal || 1;
    const y0 = PAD.t + innerH - ((0 - minVal) / r) * innerH;
    const y0c = Math.min(Math.max(y0, PAD.t), bottomY);
    const first = pro[0]!;
    const last = pro[pro.length - 1]!;
    const line = pro.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    return `${line} L${last.x},${y0c} L${first.x},${y0c} Z`;
  }, [bottomY, data.length, innerH, paths]);

  const onMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (data.length < 1) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * W;
      const ratio = (svgX - PAD.l) / innerW;
      const i = Math.max(0, Math.min(data.length - 1, Math.round(ratio * (data.length - 1))));
      const lineX = PAD.l + (i / Math.max(1, data.length - 1)) * innerW;
      setHover({ i, x: lineX, y: 0 });
    },
    [data.length, innerW],
  );

  if (data.length < 1) {
    return (
      <div className="flex h-[340px] items-center justify-center rounded-2xl border border-[#e6eae8] bg-white text-sm text-[#5c6b66]">
        Ainda sem dados semanais. Registe vendas e despesas.
      </div>
    );
  }

  const tData = hover != null ? data[hover.i] : null;
  const lastProPt = paths?.lastPro;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e6eae8] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
      <div className="border-b border-[#e6eae8]/80 px-5 py-3.5">
        <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-xs text-[#5c6b66]">
          {subtitle ?? "O lucro (a linha mais forte) deve orientar a decisão — o ponto final resume a semana."}
        </p>
      </div>
      <div className="relative w-full p-2">
        <svg
          className="w-full"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`${uid}-profitFill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={AN.profit} stopOpacity="0.28" />
              <stop offset="100%" stopColor={AN.profit} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <line
              key={g}
              x1={PAD.l}
              x2={W - PAD.r}
              y1={PAD.t + g * innerH}
              y2={PAD.t + g * innerH}
              stroke={AN.grid}
              strokeWidth="1"
            />
          ))}
          {dProAreaUse && <path d={dProAreaUse} fill={`url(#${uid}-profitFill)`} />}
          {dExp && (
            <path
              d={dExp}
              fill="none"
              stroke={AN.red}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
            />
          )}
          {dRev && (
            <path
              d={dRev}
              fill="none"
              stroke={AN.green}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
          )}
          {dPro && (
            <path
              d={dPro}
              fill="none"
              stroke={AN.profit}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {data.map((d, i) => {
            const x = PAD.l + (i / Math.max(1, data.length - 1)) * innerW;
            return (
              <g key={d.key}>
                <line
                  x1={x}
                  x2={x}
                  y1={PAD.t}
                  y2={bottomY}
                  stroke="transparent"
                  strokeWidth="24"
                />
                <text
                  x={x}
                  y={H - 10}
                  textAnchor="middle"
                  className="fill-[#5c6b66] text-[9px] font-medium"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
          {lastProPt && trendHint && (
            <g>
              <circle
                cx={lastProPt.x}
                cy={lastProPt.y}
                r="6"
                fill="white"
                stroke={AN.profit}
                strokeWidth="2.5"
              />
              <text
                x={Math.min(lastProPt.x + 8, W - PAD.r - 88)}
                y={Math.max(PAD.t + 12, lastProPt.y - 10)}
                className="fill-slate-800 text-[10px] font-bold"
              >
                {trendHint.label}
              </text>
            </g>
          )}
          <rect
            x={PAD.l}
            y={PAD.t}
            width={innerW}
            height={innerH}
            fill="transparent"
            className="cursor-crosshair"
          />
          {hover != null && tData && (
            <line
              x1={hover.x}
              x2={hover.x}
              y1={PAD.t}
              y2={bottomY}
              stroke="rgba(15,23,42,0.1)"
              strokeWidth="1"
            />
          )}
        </svg>
        {hover != null && tData && (
          <div
            className="pointer-events-none absolute z-10 min-w-[180px] rounded-xl border border-[#e6eae8] bg-white/95 p-3 text-xs shadow-lg backdrop-blur-sm"
            style={{
              left: `calc(${(hover.x / W) * 100}% - 60px)`,
              top: 8,
            }}
          >
            <p className="mb-1 font-semibold text-slate-800">{tData.key}</p>
            <p className="text-[#1f7a63]">Fat. {formatBRL(Math.round(tData.revenue))}</p>
            <p className="text-[#c44c54]">Desp. {formatBRL(Math.round(tData.expenses))}</p>
            <p className="font-semibold text-[#0d5c4a]">Lucro {formatBRL(Math.round(tData.profit))}</p>
          </div>
        )}
      </div>
    </div>
  );
}
