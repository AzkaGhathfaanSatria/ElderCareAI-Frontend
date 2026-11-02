"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type BackendNotification,
  getNotifications,
  getStoredToken,
  markNotificationRead,
} from "../../services/backendApi";

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
const SOUND_KEY = "eldercare.alarmSound";

type AudioContextCtor = typeof AudioContext;

/** 2 = tinggi, 1 = sedang, 0 = rendah/lainnya. */
function severityOf(item: BackendNotification): 0 | 1 | 2 {
  const level = String(item.level ?? "").toLowerCase();
  if (level.includes("tinggi") || level === "high") return 2;
  if (level.includes("sedang") || level === "medium") return 1;
  return 0;
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (!Ctor) return null;
  audioContext = new Ctor();
  return audioContext;
}

/** Bunyi peringatan: 3 nada untuk level tinggi, 1 nada untuk sedang. Diam bila browser belum mengizinkan suara. */
function playAlarm(severity: 1 | 2) {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume().catch(() => undefined);
  const pulses = severity === 2 ? 3 : 1;
  const frequency = severity === 2 ? 880 : 660;
  const start = ctx.currentTime + 0.02;
  for (let i = 0; i < pulses; i += 1) {
    const at = start + i * 0.32;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.24);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.26);
  }
}

function readSoundPreference(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

/**
 * Pengawas peringatan untuk semua halaman setelah login: banner merah di atas layar, bunyi,
 * judul tab berkedip, dan notifikasi browser (bila diizinkan) saat ada peringatan baru.
 */
function AlertWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const enabled = !isPublic && Boolean(getStoredToken());

  const { data } = useQuery({
    // Key sendiri (awalan "notifications") agar tidak mengisi cache halaman lebih dulu dan memicu
    // hydration mismatch; invalidateQueries(["notifications"]) tetap menyegarkan keduanya.
    queryKey: ["notifications", "alert-watcher"],
    queryFn: getNotifications,
    refetchInterval: 15000,
    enabled,
  });

  const [soundOn, setSoundOn] = useState(true);
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  // Dibaca setelah mount supaya HTML server dan klien sama (hindari hydration mismatch).
  useEffect(() => {
    setSoundOn(readSoundPreference());
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  // Peringatan aktif = belum dibaca dengan level sedang atau tinggi, yang paling berat di depan.
  const active = useMemo(
    () =>
      (data ?? [])
        .filter((item) => !item.readAt && severityOf(item) >= 1)
        .sort((a, b) => severityOf(b) - severityOf(a)),
    [data],
  );
  const visible = active.filter((item) => !dismissed.has(item.id));
  const top = visible[0];

  // Browser mengizinkan suara hanya setelah pengguna berinteraksi sekali dengan halaman.
  useEffect(() => {
    const unlock = () => {
      const ctx = getAudioContext();
      if (ctx) void ctx.resume().catch(() => undefined);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Peringatan baru sejak halaman dibuka: bunyi dan notifikasi browser.
  useEffect(() => {
    if (!data) return;
    const fresh = data.filter((item) => !item.readAt && !seen.current.has(item.id));
    for (const item of data) seen.current.add(item.id);
    if (!primed.current) {
      primed.current = true;
      return;
    }
    const alarms = fresh.filter((item) => severityOf(item) >= 1);
    const first = alarms.sort((a, b) => severityOf(b) - severityOf(a))[0];
    if (!first) return;

    if (soundOn) playAlarm(severityOf(first) === 2 ? 2 : 1);

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const notification = new Notification(first.title ?? "Peringatan ElderCare AI", {
        body: [first.elderName, first.description ?? first.message].filter(Boolean).join(": "),
        icon: "/favicon.png",
        tag: "eldercare-alarm",
      });
      notification.onclick = () => {
        window.focus();
        router.push("/notifications");
        notification.close();
      };
    }
  }, [data, soundOn, router]);

  // Judul tab berkedip saat ada peringatan dan tab sedang tidak dilihat.
  const activeCount = active.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname memicu penyegaran judul dasar setelah pindah halaman
  useEffect(() => {
    if (activeCount === 0) return;
    const base = document.title;
    let flash = false;
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        document.title = base;
        flash = false;
        return;
      }
      flash = !flash;
      document.title = flash ? `⚠ (${activeCount}) Peringatan!` : base;
    }, 1000);
    return () => {
      window.clearInterval(timer);
      document.title = base;
    };
  }, [activeCount, pathname]);

  const toggleSound = useCallback(() => {
    setSoundOn((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(SOUND_KEY, next ? "on" : "off");
      } catch {
        // Pilihan tetap berlaku selama halaman terbuka.
      }
      if (next) playAlarm(1);
      return next;
    });
  }, []);

  const askBrowserPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    setPermission(await Notification.requestPermission());
  }, []);

  const markRead = useCallback(
    async (id: string) => {
      setDismissed((current) => new Set(current).add(id));
      try {
        await markNotificationRead(id);
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch {
        // Banner sudah disembunyikan; status baca akan sinkron pada pembaruan berikutnya.
      }
    },
    [queryClient],
  );

  const dismissAll = useCallback(() => {
    setDismissed((current) => {
      const next = new Set(current);
      for (const item of active) next.add(item.id);
      return next;
    });
  }, [active]);

  if (!enabled || !top) return null;

  const high = severityOf(top) === 2;
  const others = visible.length - 1;
  const target = top.elderId
    ? `/elderly?lansia=${encodeURIComponent(top.elderId)}`
    : "/notifications";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed inset-x-0 top-0 z-[70] animate-slide-down shadow-[var(--shadow-card-lg)] ${
        high ? "bg-danger text-white" : "bg-warn text-ink"
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 animate-pulse-soft items-center justify-center rounded-full text-base font-bold ${
              high ? "bg-white/20" : "bg-ink/10"
            }`}
            aria-hidden="true"
          >
            !
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {high ? "Peringatan darurat" : "Peringatan"}: {top.title ?? "Kondisi perlu perhatian"}
              {top.elderName ? ` · ${top.elderName}` : ""}
            </p>
            <p className="mt-0.5 text-xs opacity-90">
              {top.description ?? top.message ?? "Buka detail untuk melihat kondisi terbaru."}
              {others > 0 ? ` (+${others} peringatan lain)` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => router.push(target)}
            className={`rounded-full px-4 py-2 transition duration-200 active:scale-[0.98] ${
              high
                ? "bg-white text-danger hover:bg-white/90"
                : "bg-ink text-paper hover:bg-ink-soft"
            }`}
          >
            Lihat detail
          </button>
          <button
            type="button"
            onClick={() => void markRead(top.id)}
            className="rounded-full border border-current/40 px-4 py-2 transition duration-200 hover:bg-white/10"
          >
            Tandai dibaca
          </button>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className="rounded-full border border-current/40 px-3 py-2 transition duration-200 hover:bg-white/10"
          >
            {soundOn ? "Suara: nyala" : "Suara: mati"}
          </button>
          {permission === "default" && (
            <button
              type="button"
              onClick={() => void askBrowserPermission()}
              className="rounded-full border border-current/40 px-3 py-2 transition duration-200 hover:bg-white/10"
            >
              Aktifkan notifikasi browser
            </button>
          )}
          <button
            type="button"
            onClick={dismissAll}
            aria-label="Sembunyikan banner"
            className="flex h-8 w-8 items-center justify-center rounded-full transition duration-200 hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertWatcher;
