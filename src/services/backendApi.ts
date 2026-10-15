import type { PublicUser, UserRole } from "../types/auth";
import type { AlertLevel, ElderCareData, ElderlyId } from "../types/elderCare";

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000").replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "eldercare_access_token";
const REFRESH_TOKEN_KEY = "eldercare_refresh_token";

export function getBackendBaseUrl() { return API_BASE_URL; }

type JsonObject = Record<string, unknown>;

export interface BackendElder {
  id: string;
  name: string;
  birthDate?: string | undefined;
  age?: number | undefined;
  address?: string | undefined;
  healthNotes?: string | undefined;
  monitoringStatus?: string | undefined;
}

export interface BackendDevice {
  id: string;
  deviceKey?: string | undefined;
  deviceId?: string | undefined;
  type?: string | undefined;
  kind?: string | undefined;
  name?: string | undefined;
  status?: string | undefined;
  battery?: number | null | undefined;
  lastSeen?: string | null | undefined;
  elderId?: string | undefined;
  elderName?: string | undefined;
  pairedAt?: string | undefined;
}

export interface BackendNotification {
  id: string;
  title?: string | undefined;
  type?: string | undefined;
  description?: string | undefined;
  message?: string | undefined;
  level?: AlertLevel | string | undefined;
  createdAt?: string | undefined;
  timestamp?: string | undefined;
  readAt?: string | null | undefined;
  elderId?: string | undefined;
  elderName?: string | undefined;
}

export interface BackendAccessGrant {
  id: string;
  userId?: string | undefined;
  name?: string | undefined;
  email?: string | undefined;
  specialization?: string | undefined;
  status?: string | undefined;
  grantedAt?: string | undefined;
}

export interface BackendUser extends PublicUser {
  status?: "Aktif" | "Nonaktif" | string;
  createdAt?: string | undefined;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function pickString(value: unknown, ...keys: string[]): string | undefined {
  if (!isObject(value)) return undefined;
  for (const key of keys) {
    if (typeof value[key] === "string") return value[key] as string;
    if (typeof value[key] === "number") return String(value[key]);
  }
  return undefined;
}

function pickNumber(value: unknown, ...keys: string[]): number | undefined {
  if (!isObject(value)) return undefined;
  for (const key of keys) {
    if (typeof value[key] === "number") return value[key] as number;
  }
  return undefined;
}

function pickArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isObject(value)) {
    for (const key of ["data", "items", "elders", "users", "devices", "notifications", "grants"]) {
      if (Array.isArray(value[key])) return value[key] as unknown[];
    }
  }
  return [];
}

async function readBody(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function errorMessage(body: unknown, fallback: string): string {
  if (isObject(body)) {
    if (typeof body.message === "string") return body.message;
    if (typeof body.error === "string") return body.error;
  }
  return fallback;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

function saveToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

// Backend membungkus respons dalam { success, message, data: {...} }
function unwrap(body: unknown): unknown {
  return isObject(body) && isObject(body.data) ? body.data : body;
}

function extractAccessToken(body: unknown): string | null {
  const src = unwrap(body);
  if (!isObject(src)) return null;
  const direct = src.accessToken ?? src.access_token ?? src.token;
  return typeof direct === "string" ? direct : null;
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

function saveRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
  else window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function backendFetch<T = unknown>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry && !path.startsWith("/auth/refresh")) {
    const refreshed = await refreshSession();
    if (refreshed) return backendFetch<T>(path, init, false);
  }

  const body = await readBody(response);
  if (!response.ok) throw new Error(errorMessage(body, `Request ${path} gagal (${response.status}).`));
  return body as T;
}

export async function login(input: { email: string; password: string }): Promise<PublicUser> {
  const body = await backendFetch<unknown>("/auth/login", { method: "POST", body: JSON.stringify(input) }, false);
  const data = unwrap(body);
  saveToken(extractAccessToken(body));
  if (isObject(data) && typeof data.refreshToken === "string") saveRefreshToken(data.refreshToken);
  const value = isObject(data) && isObject(data.user) ? data.user : data;
  return normalizeUser(value);
}

export async function register(input: { name: string; email: string; password: string; role: UserRole }) {
  const payload = { nama: input.name, email: input.email, password: input.password, role: input.role };
  return backendFetch<unknown>("/auth/register", { method: "POST", body: JSON.stringify(payload) }, false);
}

export async function logout() {
  try {
    await backendFetch("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken: getRefreshToken() }) }, false);
  } finally {
    saveToken(null);
    saveRefreshToken(null);
  }
}

export async function refreshSession(): Promise<boolean> {
  try {
    const body = await backendFetch<unknown>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: getRefreshToken() }) }, false);
    const token = extractAccessToken(body);
    if (token) saveToken(token);
    return true;
  } catch {
    return false;
  }
}

export async function getMe(): Promise<PublicUser> {
  const body = await backendFetch<unknown>("/auth/me");
  const data = unwrap(body);
  return normalizeUser(isObject(data) && isObject(data.user) ? data.user : data);
}

export async function updateMe(input: { name?: string | undefined; email?: string }) {
  const body = await backendFetch<unknown>("/me", { method: "PATCH", body: JSON.stringify(input) });
  return normalizeUser(isObject(body) && isObject(body.user) ? body.user : body);
}

export async function requestPasswordReset(email: string) {
  return backendFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }, false);
}

export async function resetPassword(input: { token: string; password: string }) {
  return backendFetch("/auth/reset-password", { method: "POST", body: JSON.stringify(input) }, false);
}

export async function getElders(): Promise<BackendElder[]> {
  const body = await backendFetch<unknown>("/elders");
  return pickArray(body).map(normalizeElder);
}

export async function createElder(input: Record<string, unknown>): Promise<BackendElder> {
  const body = await backendFetch<unknown>("/elders", { method: "POST", body: JSON.stringify(input) });
  return normalizeElder(isObject(body) && isObject(body.elder) ? body.elder : body);
}

export async function getElderSummary(elderId: string): Promise<unknown> {
  return backendFetch(`/elders/${encodeURIComponent(elderId)}/summary`);
}

export async function getElderVitals(elderId: string, from?: string, to?: string): Promise<unknown> {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return backendFetch(`/elders/${encodeURIComponent(elderId)}/vitals${suffix}`);
}

export async function getElderHistory(elderId: string): Promise<unknown> {
  return backendFetch(`/elders/${encodeURIComponent(elderId)}/history`);
}

export async function getDevices(): Promise<BackendDevice[]> {
  const body = await backendFetch<unknown>("/devices");
  return pickArray(body).map(normalizeDevice);
}

export async function createWearable(input: Record<string, unknown>): Promise<BackendDevice> {
  const body = await backendFetch<unknown>("/devices/wearables", { method: "POST", body: JSON.stringify(input) });
  const device = normalizeDevice(isObject(body) && isObject(body.device) ? body.device : body);
  // Device key hanya dikirim backend sekali saat wearable dibuat.
  const deviceKey = isObject(body) && typeof body.deviceKey === "string" ? body.deviceKey : undefined;
  return deviceKey ? { ...device, deviceKey } : device;
}

export async function createCamera(input: Record<string, unknown>): Promise<BackendDevice> {
  const body = await backendFetch<unknown>("/devices/cameras", { method: "POST", body: JSON.stringify(input) });
  const device = normalizeDevice(isObject(body) && isObject(body.device) ? body.device : body);
  const deviceKey = isObject(body) && typeof body.deviceKey === "string" ? body.deviceKey : undefined;
  return deviceKey ? { ...device, deviceKey } : device;
}

export async function pairDevice(deviceId: string, elderId: string) {
  return backendFetch(`/devices/${encodeURIComponent(deviceId)}/pair`, {
    method: "POST",
    body: JSON.stringify({ elderId }),
  });
}

export async function getNotifications(): Promise<BackendNotification[]> {
  const body = await backendFetch<unknown>("/notifications");
  return pickArray(body).map(normalizeNotification);
}

export async function getAccessGrants(elderId: string): Promise<BackendAccessGrant[]> {
  const body = await backendFetch<unknown>(`/elders/${encodeURIComponent(elderId)}/access-grants`);
  return pickArray(body).map(normalizeGrant);
}

export async function createAccessGrant(elderId: string, input: { email: string }) {
  return backendFetch(`/elders/${encodeURIComponent(elderId)}/access-grants`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function revokeAccessGrant(elderId: string, grantId: string) {
  return backendFetch(`/elders/${encodeURIComponent(elderId)}/access-grants`, {
    method: "DELETE",
    body: JSON.stringify({ grantId }),
  });
}

export async function getNotificationPreferences(): Promise<JsonObject> {
  return backendFetch<JsonObject>("/me/notification-preferences");
}

export async function updateNotificationPreferences(input: Record<string, unknown>) {
  return backendFetch("/me/notification-preferences", { method: "PUT", body: JSON.stringify(input) });
}

export async function registerPushToken(token: string, platform = "web") {
  return backendFetch("/me/push-tokens", {
    method: "POST",
    body: JSON.stringify({ token, platform }),
  });
}

export async function getBackendHealth() {
  return backendFetch<JsonObject>("/health", {}, false);
}

export async function getUsers(): Promise<BackendUser[]> {
  const body = await backendFetch<unknown>("/users");
  return pickArray(body).map(normalizeUserWithStatus);
}

export async function createUser(input: Record<string, unknown>) {
  return backendFetch("/users", { method: "POST", body: JSON.stringify(input) });
}

export async function updateUser(id: string, input: Record<string, unknown>) {
  return backendFetch(`/users/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteUser(id: string) {
  return backendFetch(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function updateAlert(alertId: string, input: Record<string, unknown>) {
  return backendFetch(`/alerts/${encodeURIComponent(alertId)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export interface BaselineFeature {
  key: string;
  label: string;
  unit: string;
  normal: number | null;
  current: number | null;
  status: "Normal" | "Berubah" | null;
}

export interface BaselineInfo {
  status: "belajar" | "aktif";
  aiEnabled: boolean;
  daysCollected: number;
  daysRequired: number;
  samples: number;
  samplesRequired: number;
  updatedAt: string | null;
  zThreshold: number | null;
  fitur: BaselineFeature[];
}

export async function getElderBaseline(elderId: string): Promise<BaselineInfo> {
  return backendFetch<BaselineInfo>(`/elders/${encodeURIComponent(elderId)}/baseline`);
}

export async function trainElderBaseline(elderId: string): Promise<BaselineInfo> {
  return backendFetch<BaselineInfo>(`/elders/${encodeURIComponent(elderId)}/baseline/train`, { method: "POST" });
}

export async function markNotificationRead(id: string) {
  return backendFetch(`/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead() {
  return backendFetch("/notifications/read-all", { method: "POST" });
}

/** Buat device key baru untuk wearable atau kamera (key lama langsung tidak berlaku). Key hanya dikirim sekali. */
export async function rotateDeviceKey(deviceId: string): Promise<string> {
  const body = await backendFetch<unknown>(`/devices/${encodeURIComponent(deviceId)}/rotate-key`, { method: "POST" });
  const key = isObject(body) ? body.deviceKey : undefined;
  if (typeof key !== "string") throw new Error("Backend tidak mengirim device key.");
  return key;
}

export const rotateWearableKey = rotateDeviceKey;

export async function confirmFall(fallId: string, confirmed: boolean) {
  return backendFetch(`/falls/${encodeURIComponent(fallId)}/confirm`, {
    method: "PATCH",
    body: JSON.stringify({ confirmed }),
  });
}

function normalizeUser(value: unknown): PublicUser {
  return {
    id: pickString(value, "id", "userId", "id_user") ?? "",
    name: pickString(value, "name", "nama") ?? "",
    email: pickString(value, "email") ?? "",
    role: (pickString(value, "role", "peran") ?? "keluarga") as UserRole,
  };
}

function normalizeUserWithStatus(value: unknown): BackendUser {
  const user = normalizeUser(value);
  return {
    ...user,
    status: pickString(value, "status", "accountStatus") ?? "Aktif",
    createdAt: pickString(value, "createdAt", "created_at", "tanggal_dibuat"),
  };
}

function normalizeElder(value: unknown): BackendElder {
  return {
    id: pickString(value, "id", "elderId", "id_lansia") ?? "",
    name: pickString(value, "name", "nama") ?? "Lansia",
    birthDate: pickString(value, "birthDate", "birth_date", "tanggal_lahir"),
    age: pickNumber(value, "age", "umur"),
    address: pickString(value, "address", "alamat"),
    healthNotes: pickString(value, "healthNotes", "health_notes", "catatan_kesehatan"),
    monitoringStatus: pickString(value, "monitoringStatus", "status_monitoring"),
  };
}

function normalizeDevice(value: unknown): BackendDevice {
  return {
    id: pickString(value, "id", "deviceId", "id_perangkat") ?? "",
    deviceId: pickString(value, "deviceId", "device_id", "id_wearable", "id_kamera"),
    type: pickString(value, "type", "deviceType", "tipe"),
    kind: pickString(value, "kind", "jenis"),
    name: pickString(value, "name", "nama"),
    status: pickString(value, "status", "deviceStatus", "status_perangkat") ?? "Terputus",
    battery: pickNumber(value, "battery", "baterai"),
    lastSeen: pickString(value, "lastSeen", "last_seen"),
    elderId: pickString(value, "elderId", "elder_id", "id_lansia"),
    elderName: pickString(value, "elderName", "elder_name", "nama_lansia"),
    pairedAt: pickString(value, "pairedAt", "paired_at", "tanggal_pairing"),
  };
}

function normalizeNotification(value: unknown): BackendNotification {
  return {
    id: pickString(value, "id", "notificationId", "id_notifikasi") ?? crypto.randomUUID(),
    title: pickString(value, "title", "judul", "type", "jenis"),
    type: pickString(value, "type", "jenis"),
    description: pickString(value, "description", "deskripsi", "message", "pesan"),
    message: pickString(value, "message", "pesan"),
    level: pickString(value, "level", "tingkat", "severity") as AlertLevel | undefined,
    createdAt: pickString(value, "createdAt", "created_at", "timestamp", "waktu"),
    timestamp: pickString(value, "timestamp", "waktu"),
    readAt: pickString(value, "readAt", "read_at") ?? null,
    elderId: pickString(value, "elderId", "elder_id", "id_lansia"),
    elderName: pickString(value, "elderName", "elder_name", "nama_lansia"),
  };
}

function normalizeGrant(value: unknown): BackendAccessGrant {
  return {
    id: pickString(value, "id", "grantId", "id_izin") ?? "",
    userId: pickString(value, "userId", "user_id", "id_user_medis"),
    name: pickString(value, "name", "nama"),
    email: pickString(value, "email"),
    specialization: pickString(value, "specialization", "spesialisasi", "role", "peran"),
    status: pickString(value, "status") ?? "aktif",
    grantedAt: pickString(value, "grantedAt", "granted_at", "tanggal_diberikan"),
  };
}

/** Data kosong untuk akun yang belum punya lansia: halaman tetap terbuka, angka 0, tanpa error. */
export function emptyElderCareData(): ElderCareData {
  return {
    elderly: { id: "" as ElderlyId, name: "", age: 0, monitoringStatus: "Tidak Aktif", wearableStatus: "Terputus" },
    health: { heartRate: 0, heartRateUnit: "BPM", activity: 0, activityUnit: "%", sleep: 0, sleepUnit: "Jam", risk: "Rendah" },
    activityHistory: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => ({ day, value: 0 })),
    alert: { hasAlert: false, type: "", description: "", detected: "", level: "Rendah" },
    devices: [],
    anomalyHistory: [],
  };
}

export async function fetchElderCareData(): Promise<ElderCareData> {
  const elders = await getElders();
  const elder = elders[0];
  if (!elder) return emptyElderCareData();

  const [summary, devices, history] = await Promise.all([
    getElderSummary(elder.id).catch(() => null),
    getDevices().catch(() => [] as BackendDevice[]),
    getElderHistory(elder.id).catch(() => null),
  ]);

  return normalizeMonitoringData(elder, summary, devices, history);
}

function normalizeMonitoringData(elder: BackendElder, summary: unknown, devices: BackendDevice[], history: unknown): ElderCareData {
  const root = isObject(summary) ? summary : {};
  const health = isObject(root.health) ? root.health : root;
  const alert = isObject(root.alert) ? root.alert : {};
  const activity = Array.isArray(root.activityHistory) ? root.activityHistory : Array.isArray(root.activity) ? root.activity : [];
  const anomalies = Array.isArray(root.anomalyHistory) ? root.anomalyHistory : isObject(history) && Array.isArray(history.items) ? history.items : [];

  const risk = (pickString(health, "risk", "riskLevel", "tingkat_risiko") ?? "Rendah") as AlertLevel;
  const monitoringStatus = elder.monitoringStatus ?? "Aktif";

  return {
    elderly: {
      id: elder.id as ElderlyId,
      name: elder.name,
      age: elder.age ?? calculateAge(elder.birthDate),
      monitoringStatus: monitoringStatus === "Tidak Aktif" ? "Tidak Aktif" : "Aktif",
      wearableStatus: devices.some((d) => isWearable(d) && isConnected(d)) ? "Terhubung" : "Terputus",
    },
    health: {
      heartRate: pickNumber(health, "heartRate", "heart_rate", "bpm", "detak_jantung") ?? 0,
      heartRateUnit: "BPM",
      activity: pickNumber(health, "activity", "activityPercent", "aktivitas") ?? 0,
      activityUnit: "%",
      sleep: pickNumber(health, "sleep", "sleepHours", "durasi_tidur") ?? 0,
      sleepUnit: "Jam",
      risk,
    },
    activityHistory: activity.map((item) => ({
      day: pickString(item, "day", "hari", "date", "tanggal") ?? "",
      value: pickNumber(item, "value", "activity", "aktivitas") ?? 0,
    })),
    alert: {
      id: pickString(alert, "id"),
      fallId: pickString(alert, "fallId"),
      status: pickString(alert, "status"),
      hasAlert: Boolean(root.hasAlert ?? alert.hasAlert ?? alert.id ?? alert.status),
      type: pickString(alert, "type", "jenis", "title", "judul") ?? "Peringatan",
      description: pickString(alert, "description", "deskripsi", "message", "pesan") ?? "",
      detected: pickString(alert, "detected", "createdAt", "created_at", "timestamp", "waktu") ?? "",
      level: (pickString(alert, "level", "severity", "tingkat") ?? risk) as AlertLevel,
    },
    devices: devices.map((device) => ({
      name: device.name ?? device.deviceId ?? device.type ?? "Perangkat",
      description: device.kind ?? device.type ?? "Perangkat monitoring",
      status: device.status ?? "Terputus",
    })),
    anomalyHistory: anomalies.map((item) => ({
      date: pickString(item, "date", "tanggal", "createdAt", "created_at") ?? "",
      time: pickString(item, "time", "waktu") ?? "",
      type: pickString(item, "type", "jenis", "title", "judul") ?? "Anomali",
      description: pickString(item, "description", "deskripsi", "message", "pesan") ?? "",
      level: (pickString(item, "level", "severity", "tingkat") ?? "Rendah") as AlertLevel,
      period: "7 Hari",
    })),
  };
}

function isWearable(device: BackendDevice) {
  return `${device.kind ?? ""} ${device.type ?? ""} ${device.name ?? ""}`.toLowerCase().includes("wear");
}

function isConnected(device: BackendDevice) {
  return ["terhubung", "connected", "aktif", "online"].includes((device.status ?? "").toLowerCase());
}

function calculateAge(birthDate?: string) {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}
