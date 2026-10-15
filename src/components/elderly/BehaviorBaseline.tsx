"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getElderBaseline, trainElderBaseline } from "../../services/backendApi";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

interface BehaviorBaselineProps {
  elderId: string;
}

const number = (value: number | null, unit: string) =>
  value === null ? "-" : `${value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;

function BehaviorBaseline({ elderId }: BehaviorBaselineProps) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["baseline", elderId], queryFn: () => getElderBaseline(elderId) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const retrain = async () => {
    setBusy(true);
    setError("");
    try {
      const fresh = await trainElderBaseline(elderId);
      queryClient.setQueryData(["baseline", elderId], fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memperbarui baseline.");
    } finally {
      setBusy(false);
    }
  };

  const info = query.data;
  const progress = info ? Math.min(100, Math.round((info.daysCollected / Math.max(info.daysRequired, 1)) * 100)) : 0;

  return (
    <Card className="p-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg text-ink">Pola Normal (Baseline)</h2>

          <p className="mt-1 text-sm text-muted">Kebiasaan tanda vital lansia ini, dipelajari dari data wearable-nya sendiri.</p>
        </div>

        {info && <Badge variant={info.status === "aktif" ? "success" : "warning"}>{info.status === "aktif" ? "Aktif" : "Mempelajari"}</Badge>}
      </header>

      {query.isPending && <p className="text-sm text-muted">Memuat baseline...</p>}

      {query.isError && (
        <p className="text-sm text-danger" role="alert">
          Baseline belum bisa dimuat.
        </p>
      )}

      {info && info.status === "belajar" && (
        <div>
          <p className="text-sm leading-6 text-ink-soft">
            Sistem masih mempelajari pola normal lansia ini. Sementara itu, deteksi anomali memakai pola umum.
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border" aria-hidden="true">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>

          <p className="mt-2 text-xs text-muted">
            Data terkumpul: {info.daysCollected.toLocaleString("id-ID")} dari {info.daysRequired} hari · {info.samples} dari {info.samplesRequired} pembacaan
          </p>

          {!info.aiEnabled && <p className="mt-2 text-xs text-muted">Layanan AI belum aktif, jadi baseline belum bisa dibentuk.</p>}
        </div>
      )}

      {info && info.status === "aktif" && (
        <>
          <div className="divide-y divide-border">
            {info.fitur.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <h3 className="text-sm font-semibold text-ink-soft">{row.label}</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Biasanya {number(row.normal, row.unit)} · terakhir {number(row.current, row.unit)}
                  </p>
                </div>

                {row.status && (
                  <span className={`inline-flex items-center gap-2 text-sm font-medium ${row.status === "Normal" ? "text-safe" : "text-accent-dark"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${row.status === "Normal" ? "bg-safe" : "bg-warn"}`} aria-hidden="true" />
                    {row.status}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <p className="text-xs text-muted">
              Diperbarui {info.updatedAt ? new Date(info.updatedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}
            </p>

            <Button variant="secondary" size="sm" disabled={busy} onClick={retrain}>
              {busy ? "Memperbarui..." : "Perbarui sekarang"}
            </Button>
          </div>
        </>
      )}

      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}

export default BehaviorBaseline;
