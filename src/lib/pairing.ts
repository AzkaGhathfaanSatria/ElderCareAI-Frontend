// Alamat backend yang dipakai HP untuk mengirim data wearable. Tidak perlu mengubah kode:
// pengguna bisa mengisinya langsung di kolom di bawah QR (disimpan di browser).
const STORAGE_KEY = "eldercare.deviceBackendUrl";

const ENV_DEVICE_URL = process.env.NEXT_PUBLIC_DEVICE_BACKEND_URL;
const ENV_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

/** Rapikan isian pengguna: tambah http:// bila tidak ada skema, buang spasi dan garis miring di akhir. */
export function normalizeServerUrl(raw: string): string {
  const v = raw.trim().replace(/\/+$/, "");
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `http://${v}`;
}

export function isValidServerUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.length > 0;
  } catch {
    return false;
  }
}

/** True bila alamat hanya bisa dijangkau dari komputer yang sama (HP tidak akan bisa konek). */
export function isLocalOnlyUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
  } catch {
    return false;
  }
}

/**
 * Tebakan awal alamat server. Urutan:
 * 1. NEXT_PUBLIC_DEVICE_BACKEND_URL bila diisi.
 * 2. Bila website dibuka lewat IP (mis. http://192.168.1.10:3000), pakai IP yang sama dengan port backend.
 * 3. NEXT_PUBLIC_BACKEND_URL.
 * Hanya dipanggil di browser.
 */
export function guessServerUrl(): string {
  if (ENV_DEVICE_URL) return normalizeServerUrl(ENV_DEVICE_URL);
  if (typeof window !== "undefined" && /^\d{1,3}(\.\d{1,3}){3}$/.test(window.location.hostname)) {
    let port = "4000";
    try {
      port = new URL(ENV_BACKEND_URL).port || port;
    } catch {
      // abaikan, pakai 4000
    }
    return `http://${window.location.hostname}:${port}`;
  }
  return normalizeServerUrl(ENV_BACKEND_URL);
}

/** Alamat yang terakhir dipakai pengguna (kalau ada), jika tidak pakai tebakan awal. */
export function loadServerUrl(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && isValidServerUrl(saved)) return saved;
  } catch {
    // localStorage bisa tidak tersedia (mode privat); lanjut ke tebakan
  }
  return guessServerUrl();
}

export function saveServerUrl(url: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, url);
  } catch {
    // tidak fatal: hanya tidak diingat
  }
}

/** Wearable memakai key berawalan "ecw_" (kamera "ecc_"); hanya wearable yang dipasangkan lewat HP. */
export function isWearableKey(key: string): boolean {
  return key.startsWith("ecw_");
}

/** Tautan pairing yang dibaca aplikasi mobile ElderCare AI (lewat scan QR atau dibuka langsung di HP). */
export function buildPairingLink(serverUrl: string, deviceKey: string): string {
  const params = new URLSearchParams({ u: serverUrl, k: deviceKey });
  return `eldercare://pair?${params.toString()}`;
}
