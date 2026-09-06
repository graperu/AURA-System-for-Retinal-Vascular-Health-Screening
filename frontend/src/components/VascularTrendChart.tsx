import React, { useMemo, useState } from "react";

export interface VascularPoint {
  screeningId?: string;
  recordedAt: string;
  avRatio?: number | null;
  vesselDensityPercent?: number | null;
  tortuosityIndex?: number | null;
  verticalCdr?: number | null;
  cardiovascularRiskScore?: number | null;
  riskLevel?: string | null;
}

type SeriesKey =
  | "avRatio"
  | "vesselDensityPercent"
  | "tortuosityIndex"
  | "cardiovascularRiskScore";

const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: "avRatio", label: "AVR (A/V)", color: "#0891B2" },
  { key: "vesselDensityPercent", label: "Mật độ mạch (%)", color: "#16A34A" },
  { key: "tortuosityIndex", label: "Xoắn mạch", color: "#D97706" },
  {
    key: "cardiovascularRiskScore",
    label: "Nguy cơ TM (điểm)",
    color: "#E11D48",
  },
];

export const VascularTrendChart: React.FC<{
  points: VascularPoint[];
  title?: string;
}> = ({ points, title = "Timeline xu hướng vi mạch (FR-17)" }) => {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const sorted = useMemo(
    () =>
      [...points].sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      ),
    [points],
  );

  const w = 720;
  const h = 260;
  const pad = { l: 44, r: 16, t: 16, b: 36 };

  const xs = sorted.map((_, i) => {
    if (sorted.length === 1) return pad.l + (w - pad.l - pad.r) / 2;
    return pad.l + (i * (w - pad.l - pad.r)) / (sorted.length - 1);
  });

  const pathFor = (key: SeriesKey) => {
    const vals = sorted.map((p) => {
      const v = p[key];
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    });
    const nums = vals.filter((v): v is number => v != null);
    if (nums.length === 0) return "";
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const span = max - min || 1;
    const innerH = h - pad.t - pad.b;
    const pts: string[] = [];
    vals.forEach((v, i) => {
      if (v == null) return;
      const y = pad.t + innerH - ((v - min) / span) * innerH;
      pts.push(`${xs[i]},${y}`);
    });
    return pts.join(" ");
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Biểu đồ đường theo thời gian các lần khám: AVR, mật độ mạch, xoắn mạch
          và điểm nguy cơ tim mạch.
        </p>
      </div>
      {sorted.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">
          Chưa có đủ ca phân tích để vẽ xu hướng.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {SERIES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() =>
                  setHidden((prev) => ({ ...prev, [s.key]: !prev[s.key] }))
                }
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  hidden[s.key]
                    ? "bg-slate-100 text-slate-400 border-slate-200"
                    : "bg-white text-slate-800"
                }`}
                style={{
                  borderColor: hidden[s.key] ? undefined : s.color,
                  color: hidden[s.key] ? undefined : s.color,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${w} ${h}`}
              className="w-full min-w-[520px] h-64"
            >
              <rect x="0" y="0" width={w} height={h} fill="#F8FAFC" rx="12" />
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y = pad.t + t * (h - pad.t - pad.b);
                return (
                  <line
                    key={t}
                    x1={pad.l}
                    x2={w - pad.r}
                    y1={y}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                );
              })}
              {SERIES.map((s) =>
                hidden[s.key] ? null : (
                  <polyline
                    key={s.key}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={pathFor(s.key)}
                  />
                ),
              )}
              {sorted.map((p, i) => (
                <text
                  key={p.screeningId || i}
                  x={xs[i]}
                  y={h - 10}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748B"
                >
                  {new Date(p.recordedAt).toLocaleDateString("vi-VN")}
                </text>
              ))}
            </svg>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="text-slate-500 font-bold">
                <tr>
                  <th className="text-left py-1">Ngày</th>
                  <th className="text-left py-1">AVR</th>
                  <th className="text-left py-1">Mật độ</th>
                  <th className="text-left py-1">Xoắn</th>
                  <th className="text-left py-1">CDR</th>
                  <th className="text-left py-1">Nguy cơ</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr
                    key={p.screeningId || i}
                    className="border-t border-slate-100 font-mono-data"
                  >
                    <td className="py-1.5">
                      {new Date(p.recordedAt).toLocaleString("vi-VN")}
                    </td>
                    <td>{p.avRatio ?? "—"}</td>
                    <td>{p.vesselDensityPercent ?? "—"}</td>
                    <td>{p.tortuosityIndex ?? "—"}</td>
                    <td>{p.verticalCdr ?? "—"}</td>
                    <td>{p.riskLevel || p.cardiovascularRiskScore || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
