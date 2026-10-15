export type ElderlyId = string & {
  readonly __brand: "ElderlyId";
};

export type MonitoringStatus = "Aktif" | "Tidak Aktif";
export type WearableStatus = "Terhubung" | "Terputus";
export type AlertLevel = "Rendah" | "Sedang" | "Tinggi";
export type Period = "7 Hari" | "30 Hari" | "3 Bulan";

export interface Elderly {
  id: ElderlyId;
  name: string;
  age: number;
  monitoringStatus: MonitoringStatus;
  wearableStatus: WearableStatus;
}

export interface Health {
  heartRate: number;
  heartRateUnit: string;
  activity: number;
  activityUnit: string;
  sleep: number;
  sleepUnit: string;
  risk: AlertLevel;
}

export interface ActivityHistoryItem {
  day: string;
  value: number;
}

export interface AlertData {
  id?: string | undefined;
  fallId?: string | undefined;
  status?: string | undefined;
  hasAlert: boolean;
  type: string;
  description: string;
  detected: string;
  level: AlertLevel;
}

export interface Device {
  name: string;
  description: string;
  status: string;
}

export interface AnomalyHistoryItem {
  date: string;
  time: string;
  type: string;
  description: string;
  level: AlertLevel;
  period: Period;
}

export interface ElderCareData {
  elderly: Elderly;
  health: Health;
  activityHistory: ActivityHistoryItem[];
  alert: AlertData;
  devices: Device[];
  anomalyHistory: AnomalyHistoryItem[];
}

export type FetchState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };
