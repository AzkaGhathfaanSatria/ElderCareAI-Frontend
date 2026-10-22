import type { Metadata } from "next";
import { Suspense } from "react";

import PageLoadingFallback from "../../components/ui/PageLoadingFallback";
import DeviceManagement from "../../features/DeviceManagement";

export const metadata: Metadata = {
  title: "Perangkat | ElderCare AI",
  description: "Kelola wearable dan kamera CCTV untuk lansia yang Anda pantau.",
};

export default function FamilyDevicesPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <DeviceManagement />
    </Suspense>
  );
}
