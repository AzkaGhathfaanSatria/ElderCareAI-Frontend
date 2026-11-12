import type { Metadata } from "next";
import { Suspense } from "react";

import PageLoadingFallback from "../../components/ui/PageLoadingFallback";
import History from "../../features/History";

export const metadata: Metadata = {
  title: "Riwayat Kondisi | ElderCare AI",
  description:
    "Riwayat kondisi lansia per periode: status, detak jantung, SpO2, suhu, dan kejadian dari kamera.",
};

export default function RiwayatPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <History />
    </Suspense>
  );
}
