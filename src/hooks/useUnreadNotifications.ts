"use client";

import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "../services/backendApi";

/** Jumlah notifikasi belum dibaca; undefined selama belum termuat / gagal dimuat. */
export function useUnreadNotifications(enabled: boolean): number | undefined {
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30000,
    enabled,
  });
  if (!query.data) return undefined;
  return query.data.filter((item) => !item.readAt).length;
}
