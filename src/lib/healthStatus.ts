/** Label + warna lencana untuk kartu kesehatan, dihitung dari nilainya (bukan teks tetap). */
export type StatusVariant = "success" | "info" | "warning" | "danger" | "neutral";

export interface StatusBadge {
  label: string;
  variant: StatusVariant;
}

const NO_DATA: StatusBadge = { label: "Belum ada data", variant: "neutral" };

export function heartRateStatus(bpm: number): StatusBadge {
  if (!bpm || bpm <= 0) return NO_DATA;
  if (bpm < 50) return { label: "Terlalu rendah", variant: "danger" };
  if (bpm < 60) return { label: "Rendah", variant: "warning" };
  if (bpm <= 100) return { label: "Normal", variant: "success" };
  if (bpm <= 120) return { label: "Tinggi", variant: "warning" };
  return { label: "Sangat tinggi", variant: "danger" };
}

export function sleepStatus(hours: number): StatusBadge {
  if (!hours || hours <= 0) return NO_DATA;
  if (hours < 5) return { label: "Sangat kurang", variant: "danger" };
  if (hours < 6) return { label: "Kurang", variant: "warning" };
  if (hours <= 9) return { label: "Baik", variant: "success" };
  return { label: "Berlebih", variant: "info" };
}

export function activityStatus(percent: number): StatusBadge {
  if (!percent || percent <= 0) return NO_DATA;
  if (percent >= 50) return { label: "Aktif", variant: "info" };
  if (percent >= 20) return { label: "Sedang", variant: "info" };
  return { label: "Rendah", variant: "warning" };
}

export function riskStatus(level: string): StatusBadge {
  const l = level.toLowerCase();
  if (l === "tinggi") return { label: "Bahaya", variant: "danger" };
  if (l === "sedang") return { label: "Waspada", variant: "warning" };
  return { label: "Aman", variant: "success" };
}

/** 0 berarti belum ada pembacaan: tampil "–" supaya tidak terbaca sebagai nilai asli. */
export const valueOrDash = (value: number) => (value > 0 ? value : "–");
