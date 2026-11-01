"use client";

import type { ElderCareData } from "../../types/elderCare";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

interface EldersOverviewProps {
  items: ElderCareData[];
  selectedId: string;
  onSelect: (id: string) => void;
  onViewDetail: (id: string) => void;
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/** Kartu ringkas semua lansia yang dipantau, dengan status peringatan masing-masing. */
function EldersOverview({ items, selectedId, onSelect, onViewDetail }: EldersOverviewProps) {
  const needAttention = items.filter((item) => item.alert.hasAlert).length;

  return (
    <section className="mb-6">
      <Card className="p-6">
        <header className="mb-5">
          <h2 className="font-serif text-lg text-ink">Semua Lansia yang Dipantau</h2>

          <p className="mt-1 text-sm text-muted">
            {needAttention > 0
              ? `${needAttention} lansia memerlukan perhatian.`
              : "Tidak ada peringatan aktif pada semua lansia."}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {items.map(({ elderly, health, alert }) => {
            const selected = elderly.id === selectedId;
            return (
              <article
                key={elderly.id}
                className={`rounded-xl border p-4 ${
                  alert.hasAlert
                    ? "border-danger/30 bg-danger/5"
                    : selected
                      ? "border-accent bg-accent/5"
                      : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 font-bold text-accent-dark"
                    aria-hidden="true"
                  >
                    {initials(elderly.name)}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-ink">{elderly.name}</h3>

                    <p className="text-sm text-muted">
                      {elderly.age > 0 ? `${elderly.age} tahun` : "Usia belum diisi"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {alert.hasAlert ? (
                    <Badge variant="danger">{alert.type}</Badge>
                  ) : (
                    <Badge variant="success">Tidak ada peringatan</Badge>
                  )}

                  <Badge variant={elderly.wearableStatus === "Terhubung" ? "success" : "neutral"}>
                    Wearable {elderly.wearableStatus}
                  </Badge>
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Detak</dt>
                    <dd className="font-semibold text-ink">
                      {health.heartRate > 0 ? `${health.heartRate} ${health.heartRateUnit}` : "-"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-muted">Aktivitas</dt>
                    <dd className="font-semibold text-ink">
                      {health.activity}
                      {health.activityUnit}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-muted">Risiko</dt>
                    <dd className="font-semibold text-ink">{health.risk}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant={selected ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => onSelect(elderly.id)}
                    disabled={selected}
                    aria-label={`Tampilkan data ${elderly.name} di dashboard`}
                  >
                    {selected ? "Sedang ditampilkan" : "Tampilkan"}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onViewDetail(elderly.id)}
                    aria-label={`Lihat detail ${elderly.name}`}
                  >
                    Detail
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

export default EldersOverview;
