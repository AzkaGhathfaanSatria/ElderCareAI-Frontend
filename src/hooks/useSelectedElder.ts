"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { getElders } from "../services/backendApi";

const STORAGE_KEY = "eldercare.selectedElder";

function readStored(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * Lansia yang sedang dipilih. Urutan: parameter `?lansia=` di URL, pilihan terakhir di browser,
 * lalu lansia pertama. Halaman pemakai harus berada di dalam <Suspense> (useSearchParams).
 */
export function useSelectedElder() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const eldersQuery = useQuery({ queryKey: ["elders"], queryFn: getElders });
  const [stored, setStored] = useState(readStored);

  const elders = eldersQuery.data ?? [];
  const fromUrl = params.get("lansia") ?? "";
  const selectedId =
    elders.find((elder) => elder.id === fromUrl)?.id ??
    elders.find((elder) => elder.id === stored)?.id ??
    elders[0]?.id ??
    "";

  const select = useCallback(
    (id: string) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, id);
      } catch {
        // Penyimpanan tidak tersedia: pilihan tetap berlaku lewat URL.
      }
      setStored(id);
      const next = new URLSearchParams(params.toString());
      next.set("lansia", id);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  return {
    elders,
    selectedId,
    select,
    /** true selama daftar lansia belum selesai dimuat. */
    isLoading: eldersQuery.isPending,
  };
}
