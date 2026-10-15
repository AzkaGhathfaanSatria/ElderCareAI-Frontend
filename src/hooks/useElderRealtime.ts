"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getBackendBaseUrl, getStoredToken } from "../services/backendApi";

export function useElderRealtime(elderId?: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!elderId || typeof window === "undefined" || typeof EventSource === "undefined") return;
    const token = getStoredToken();
    if (!token) return;
    // EventSource tidak bisa mengirim header Authorization, jadi token dikirim lewat query.
    const source = new EventSource(
      `${getBackendBaseUrl()}/elders/${encodeURIComponent(elderId)}/stream?access_token=${encodeURIComponent(token)}`,
    );
    const refresh = () => { void queryClient.invalidateQueries({ queryKey: ["elder-care"] }); void queryClient.invalidateQueries({ queryKey: ["notifications"] }); };
    source.onmessage = refresh;
    source.addEventListener("alert", refresh);
    source.addEventListener("vital", refresh);
    source.addEventListener("fall", refresh);
    return () => source.close();
  }, [elderId, queryClient]);
}
