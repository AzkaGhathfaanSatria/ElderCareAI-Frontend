"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import ElderSelector from "../components/elderly/ElderSelector";
import Footer from "../components/layout/Footer";
import TopNav from "../components/layout/TopNav";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import EmptyStateMessage from "../components/ui/EmptyStateMessage";
import { useSelectedElder } from "../hooks/useSelectedElder";
import {
  type ConditionRecord,
  type ConditionStatus,
  getConditionHistory,
  type HistoryRange,
} from "../services/backendApi";

const RANGES: Array<{ value: HistoryRange; label: string }> = [
  { value: "6h", label: "6 jam" },
  { value: "24h", label: "24 jam" },
  { value: "7d", label: "7 hari" },
  { value: "30d", label: "30 hari" },
];

const STATUS: Record<
  ConditionStatus,
  { label: string; variant: "success" | "warning" | "danger" | "neutral"; color: string }
> = {
  aman: { label: "Aman", variant: "success", color: "var(--color-safe)" },
  waspada: { label: "Waspada", variant: "warning", color: "var(--color-warn)" },
  bahaya: { label: "Bahaya", variant: "danger", color: "var(--color-danger)" },
  tidak_ada_data: { label: "Tidak ada data", variant: "neutral", color: "var(--color-muted)" },
};

const PAGE_SIZE = 50;

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded-md bg-paper px-2 py-1 text-xs text-ink-soft">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

/** Grafik tren detak jantung per periode. Titik diwarnai menurut status; jeda data tidak disambung. */
function HeartRateTrend({ items }: { items: ConditionRecord[] }) {
  const points = useMemo(
    () =>
      [...items]
        .reverse()
        .filter((item) => item.detakRata !== null)
        .map((item) => ({
          t: new Date(item.waktu).getTime(),
          v: item.detakRata as number,
          status: item.status,
        })),
    [items],
  );

  if (points.length < 2) {
    return (
      <p className="text-sm text-muted">
        Grafik muncul setelah ada minimal dua data detak jantung.
      </p>
    );
  }

  const W = 640;
  const H = 170;
  const padX = 34;
  const padY = 16;
  const tMin = points[0]?.t ?? 0;
  const tMax = points[points.length - 1]?.t ?? tMin;
  const vMin = Math.floor(Math.min(...points.map((p) => p.v), 50) / 10) * 10;
  const vMax = Math.ceil(Math.max(...points.map((p) => p.v), 110) / 10) * 10;
  const x = (t: number) => padX + ((t - tMin) / Math.max(tMax - tMin, 1)) * (W - padX - 8);
  const y = (v: number) => H - padY - ((v - vMin) / Math.max(vMax - vMin, 1)) * (H - padY * 2);
  const line = points
    .map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`)
    .join(" ");
  const ticks = [vMin, Math.round((vMin + vMax) / 2), vMax];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Grafik tren detak jantung rata-rata per periode"
    >
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={padX}
            x2={W - 8}
            y1={y(tick)}
            y2={y(tick)}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
          <text
            x={padX - 6}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize="11"
            fill="var(--color-muted)"
          >
            {tick}
          </text>
        </g>
      ))}
      <path
        d={line}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p) => (
        <circle
          key={p.t}
          cx={x(p.t)}
          cy={y(p.v)}
          r="3.5"
          fill={STATUS[p.status].color}
          stroke="var(--color-surface)"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 font-serif text-2xl ${tone ?? "text-ink"}`}>{value}</p>
    </Card>
  );
}

function History() {
  const selection = useSelectedElder();
  const elder = selection.elders.find((item) => item.id === selection.selectedId);
  const [range, setRange] = useState<HistoryRange>("24h");
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const query = useQuery({
    queryKey: ["condition-history", elder?.id, range],
    queryFn: () => getConditionHistory(elder?.id ?? "", range),
    enabled: Boolean(elder?.id),
    refetchInterval: 30000,
  });

  const data = query.data;
  const all = data?.items ?? [];
  const rows = onlyIssues
    ? all.filter((item) => item.status === "waspada" || item.status === "bahaya")
    : all;
  const shown = rows.slice(0, visible);

  return (
    <div className="min-h-screen bg-paper">
      <TopNav hasNotification={false} />
      <main className="min-w-0">
        <div className="p-4 sm:p-6 lg:p-8">
          <header className="mb-6">
            <h1 className="font-serif text-2xl text-ink">Riwayat Kondisi</h1>
            <p className="mt-1 text-sm text-muted">
              Laporan kondisi {elder?.name ?? "lansia"} yang dicatat otomatis
              {data ? ` tiap ${data.intervalMenit} menit` : " secara berkala"}.
            </p>
          </header>

          <ElderSelector
            elders={selection.elders}
            selectedId={selection.selectedId}
            onSelect={selection.select}
          />

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <fieldset className="m-0 inline-flex min-w-0 rounded-lg border border-border bg-surface p-1">
              <legend className="sr-only">Rentang waktu</legend>
              {RANGES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={range === item.value}
                  onClick={() => {
                    setRange(item.value);
                    setVisible(PAGE_SIZE);
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ${
                    range === item.value ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </fieldset>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={onlyIssues}
                onChange={(event) => {
                  setOnlyIssues(event.target.checked);
                  setVisible(PAGE_SIZE);
                }}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Hanya yang perlu perhatian
            </label>
          </div>

          {selection.elders.length === 0 && !selection.isLoading ? (
            <EmptyStateMessage message="Belum ada lansia terdaftar." />
          ) : query.isError ? (
            <div
              className="rounded-lg border border-danger/25 bg-danger/6 px-4 py-3 text-sm text-danger"
              role="alert"
            >
              Riwayat tidak dapat dimuat. Pastikan backend berjalan, lalu coba lagi.
            </div>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
                <SummaryTile label="Periode tercatat" value={data?.ringkasan.total ?? "-"} />
                <SummaryTile label="Aman" value={data?.ringkasan.aman ?? "-"} tone="text-safe" />
                <SummaryTile
                  label="Waspada"
                  value={data?.ringkasan.waspada ?? "-"}
                  tone="text-accent-dark"
                />
                <SummaryTile
                  label="Bahaya"
                  value={data?.ringkasan.bahaya ?? "-"}
                  tone="text-danger"
                />
                <SummaryTile
                  label="Detak rata-rata"
                  value={
                    data?.ringkasan.detakRata != null ? `${data.ringkasan.detakRata} bpm` : "-"
                  }
                />
              </div>

              <Card className="mb-5 p-5">
                <h2 className="mb-3 font-serif text-base text-ink">Tren detak jantung</h2>
                {query.isPending ? (
                  <p className="text-sm text-muted">Memuat grafik...</p>
                ) : (
                  <HeartRateTrend items={all} />
                )}
              </Card>

              <Card className="p-5">
                <h2 className="mb-1 font-serif text-base text-ink">Catatan per periode</h2>
                <p className="mb-4 text-xs text-muted">
                  Data jam pintar masuk tiap 15 menit atau lebih, jadi sebagian periode memakai data
                  jam terakhir yang diterima.
                </p>
                {query.isPending ? (
                  <p className="text-sm text-muted">Memuat riwayat...</p>
                ) : shown.length ? (
                  <>
                    <ol className="divide-y divide-border">
                      {shown.map((item) => {
                        const st = STATUS[item.status] ?? STATUS.tidak_ada_data;
                        return (
                          <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                              <div className="w-28 shrink-0">
                                <p className="text-sm font-semibold text-ink-soft">{item.jam}</p>
                                <p className="text-xs text-muted">{item.tanggal}</p>
                              </div>
                              <Badge variant={st.variant}>{st.label}</Badge>
                              <div className="flex flex-wrap gap-1.5">
                                {item.detakRata !== null && (
                                  <Metric
                                    label="Detak"
                                    value={`${Math.round(item.detakRata)} bpm`}
                                  />
                                )}
                                {item.spo2 !== null && (
                                  <Metric label="SpO2" value={`${Math.round(item.spo2)}%`} />
                                )}
                                {item.suhu !== null && (
                                  <Metric label="Suhu" value={`${item.suhu}°C`} />
                                )}
                                {item.deteksiKamera > 0 && (
                                  <Metric label="Kamera" value={`${item.deteksiKamera} deteksi`} />
                                )}
                                {item.jatuh && <Metric label="Jatuh" value="terdeteksi" />}
                              </div>
                            </div>
                            {item.ringkasan && (
                              <p className="mt-1.5 text-sm leading-6 text-muted sm:pl-[7.75rem]">
                                {item.ringkasan}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                    {rows.length > shown.length && (
                      <button
                        type="button"
                        onClick={() => setVisible((n) => n + PAGE_SIZE)}
                        className="mt-4 w-full rounded-lg border border-border py-2 text-sm text-ink-soft transition-colors hover:bg-paper"
                      >
                        Tampilkan lebih banyak ({rows.length - shown.length} lagi)
                      </button>
                    )}
                  </>
                ) : (
                  <EmptyStateMessage
                    message={
                      onlyIssues
                        ? "Tidak ada periode yang perlu perhatian pada rentang ini."
                        : "Belum ada riwayat. Pencatatan berjalan otomatis setelah ada jam pintar atau kamera yang terhubung."
                    }
                  />
                )}
              </Card>
            </>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}

export default History;
