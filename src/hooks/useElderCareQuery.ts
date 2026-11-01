"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchElderCareData, fetchEldersOverview } from "../services/elderCareApi";

/** Data satu lansia. `enabled=false` menunda pengambilan sampai lansia yang dipilih diketahui. */
export function useElderCareQuery(elderId?: string, enabled = true) {
  return useQuery({
    queryKey: ["elder-care", elderId ?? "default"],
    queryFn: () => fetchElderCareData(elderId || undefined),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/** Ringkasan semua lansia; diperbarui tiap 15 detik seperti di aplikasi mobile. */
export function useEldersOverviewQuery() {
  return useQuery({
    queryKey: ["elder-care", "overview"],
    queryFn: fetchEldersOverview,
    refetchInterval: 15 * 1000,
    staleTime: 10 * 1000,
  });
}
