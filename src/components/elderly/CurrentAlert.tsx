"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { confirmFall, updateAlert } from "../../services/backendApi";
import type { AlertData } from "../../types/elderCare";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

interface CurrentAlertProps {
  alert: AlertData;
}

function CurrentAlert({ alert }: CurrentAlertProps) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const changeStatus = async (status: "ditindaklanjuti" | "selesai") => {
    if (!alert.id) return;
    setBusy(true);
    setError("");
    try {
      await updateAlert(alert.id, { status });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["elder-care"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memperbarui status peringatan.");
    } finally {
      setBusy(false);
    }
  };

  // Alert jatuh: keluarga/medis memastikan benar atau alarm palsu (juga jadi data evaluasi model).
  const answerFall = async (confirmed: boolean) => {
    if (!alert.fallId) return;
    setBusy(true);
    setError("");
    try {
      await confirmFall(alert.fallId, confirmed);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["elder-care"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan konfirmasi jatuh.");
    } finally {
      setBusy(false);
    }
  };

  const inProgress = (alert.status ?? "").toLowerCase() === "ditindaklanjuti";
  const awaitingFallAnswer = Boolean(alert.fallId) && !inProgress;

  return (
    <section className="mb-6" aria-label="Peringatan terkini">
      {alert.hasAlert ? (
        <div className="rounded-lg border-l-4 border-warn bg-warn/8 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warn/25 text-xs font-bold text-accent-dark"
                aria-hidden="true"
              >
                !
              </span>

              <div>
                <p className="text-sm font-semibold text-ink">{alert.type}</p>

                <p className="mt-1 text-sm leading-6 text-muted">
                  {alert.description} — terdeteksi {alert.detected}.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
              {inProgress && <Badge variant="success">Ditindaklanjuti</Badge>}
              <Badge variant="warning">Risiko {alert.level}</Badge>
            </div>
          </div>

          {alert.id && (
            <div className="mt-3 flex flex-wrap items-center gap-2 pl-9">
              {awaitingFallAnswer ? (
                <>
                  <Button variant="accent" size="sm" disabled={busy} onClick={() => answerFall(true)}>
                    Ya, benar jatuh
                  </Button>
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => answerFall(false)}>
                    Alarm palsu
                  </Button>
                </>
              ) : (
                <>
                  {!inProgress && (
                    <Button variant="secondary" size="sm" disabled={busy} onClick={() => changeStatus("ditindaklanjuti")}>
                      Tandai ditindaklanjuti
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => changeStatus("selesai")}>
                    Tandai selesai
                  </Button>
                </>
              )}
            </div>
          )}

          {error && (
            <p className="mt-2 pl-9 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border-l-4 border-safe bg-safe/8 p-4" aria-live="polite">
          <span className="text-safe" aria-hidden="true">
            ✓
          </span>

          <p className="text-sm font-medium text-safe">Tidak ada peringatan saat ini.</p>
        </div>
      )}
    </section>
  );
}

export default CurrentAlert;
