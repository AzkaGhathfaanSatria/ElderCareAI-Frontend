"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, useEffect, useState } from "react";
import {
  type CameraStream,
  type CameraStreamInput,
  getCameraStream,
  saveCameraStream,
  startCameraStream,
  stopCameraStream,
  testCameraStream,
} from "../../services/backendApi";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import { parseRtsp } from "./rtsp";

const EMPTY: CameraStreamInput = {
  host: "",
  port: null,
  username: "",
  password: "",
  path: "",
  fps: 1,
};

const STATE_LABEL: Record<
  CameraStream["state"],
  { text: string; variant: "success" | "warning" | "danger" | "neutral" }
> = {
  running: { text: "Streaming", variant: "success" },
  starting: { text: "Menghubungkan...", variant: "warning" },
  error: { text: "Error", variant: "danger" },
  stopped: { text: "Berhenti", variant: "neutral" },
};

export default function CameraStreamPanel({ deviceId }: { deviceId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CameraStreamInput>(EMPTY);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState<"" | "save" | "test" | "toggle">("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const query = useQuery({
    queryKey: ["camera-stream", deviceId],
    queryFn: () => getCameraStream(deviceId),
    enabled: open,
    // polling status hanya saat panel terbuka
    refetchInterval: open ? 4000 : false,
  });
  const stream = query.data;

  // isi form dari server sekali (password tidak pernah dikirim balik)
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (stream && !loaded) {
      if (stream.configured)
        setForm({
          host: stream.host,
          port: stream.port,
          username: stream.username,
          password: "",
          path: stream.path,
          fps: stream.fps,
        });
      setLoaded(true);
    }
  }, [stream, loaded]);

  const set = (key: keyof CameraStreamInput) => (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm((f) => ({
      ...f,
      [key]: key === "port" ? (v ? Number(v) : null) : key === "fps" ? Number(v) : v,
    }));
  };

  // Ganti IP = alamat lama tidak berlaku lagi, jadi port & path kembali otomatis.
  const changeHost = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, host: e.target.value, port: null, path: "" }));

  const refresh = (data: CameraStream) =>
    queryClient.setQueryData(["camera-stream", deviceId], data);
  const errText = (e: unknown) => (e instanceof Error ? e.message : "Terjadi kesalahan");

  const handlePaste = (value: string) => {
    setPasted(value);
    const parsed = parseRtsp(value);
    if (parsed) {
      setForm((f) => ({ ...f, ...parsed, port: Number(parsed.port) }));
      setNotice({
        ok: true,
        text: "URL dipecah ke kolom di bawah. Password tidak ditampilkan ulang setelah disimpan.",
      });
    }
  };

  const save = async () => {
    setBusy("save");
    setNotice(null);
    try {
      refresh(await saveCameraStream(deviceId, form));
      setForm((f) => ({ ...f, password: "" }));
      setPasted("");
      setNotice({ ok: true, text: "Pengaturan tersimpan." });
    } catch (e) {
      setNotice({ ok: false, text: errText(e) });
    } finally {
      setBusy("");
    }
  };

  const test = async () => {
    setBusy("test");
    setNotice({
      ok: true,
      text: "Menguji koneksi dan mencari alamat stream otomatis (bisa sampai 1 menit)...",
    });
    try {
      const r = await testCameraStream(deviceId, form);
      setNotice({ ok: r.ok, text: r.message });
    } catch (e) {
      setNotice({ ok: false, text: errText(e) });
    } finally {
      setBusy("");
    }
  };

  const toggle = async () => {
    setBusy("toggle");
    setNotice(null);
    try {
      refresh(
        stream?.enabled ? await stopCameraStream(deviceId) : await startCameraStream(deviceId),
      );
    } catch (e) {
      setNotice({ ok: false, text: errText(e) });
    } finally {
      setBusy("");
    }
  };

  const st = STATE_LABEL[stream?.state ?? "stopped"];
  const canSave = form.host.trim().length > 0;

  return (
    <div className="mt-3 w-full">
      <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
        {open ? "Tutup pengaturan stream" : "Pengaturan stream"}
      </Button>
      {open && (
        <div className="mt-3 space-y-4 rounded-xl border border-border p-4">
          {query.isPending ? (
            <p className="text-sm text-muted">Memuat...</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id={`host-${deviceId}`}
                  label="IP kamera"
                  value={form.host}
                  onChange={changeHost}
                  placeholder="192.168.1.7"
                />
                <TextField
                  id={`fps-${deviceId}`}
                  label="Frame per detik"
                  type="number"
                  min={0.2}
                  max={2}
                  step={0.1}
                  value={form.fps}
                  onChange={set("fps")}
                />
                <TextField
                  id={`user-${deviceId}`}
                  label="Username"
                  value={form.username}
                  onChange={set("username")}
                  autoComplete="off"
                />
                <TextField
                  id={`pass-${deviceId}`}
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  placeholder={stream?.hasPassword ? "Tersimpan, kosongkan jika tidak diubah" : ""}
                  autoComplete="new-password"
                />
              </div>
              <p className="text-xs text-muted">
                Port dan alamat stream dicari otomatis saat Tes koneksi atau Mulai.
              </p>
              <details className="text-sm">
                <summary className="cursor-pointer text-muted">
                  Pengaturan lanjutan (biasanya tidak perlu diisi)
                </summary>
                <div className="mt-3 space-y-4">
                  <TextField
                    id={`rtsp-${deviceId}`}
                    label="Tempel URL RTSP lengkap"
                    value={pasted}
                    onChange={(e) => handlePaste(e.target.value)}
                    placeholder="rtsp://user:password@192.168.1.7:8554/Streaming/Channels/101"
                    autoComplete="off"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      id={`port-${deviceId}`}
                      label="Port (kosong = otomatis)"
                      type="number"
                      value={form.port ?? ""}
                      onChange={set("port")}
                      placeholder="otomatis"
                    />
                    <TextField
                      id={`path-${deviceId}`}
                      label="Path stream (kosong = otomatis)"
                      value={form.path}
                      onChange={set("path")}
                      placeholder="otomatis"
                    />
                  </div>
                </div>
              </details>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!canSave || busy !== ""}
                  onClick={test}
                >
                  {busy === "test" ? "Menguji..." : "Tes koneksi"}
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  disabled={!canSave || busy !== ""}
                  onClick={save}
                >
                  {busy === "save" ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button
                  variant={stream?.enabled ? "danger" : "primary"}
                  size="sm"
                  disabled={!stream?.configured || busy !== ""}
                  onClick={toggle}
                >
                  {stream?.enabled ? "Hentikan" : "Mulai"}
                </Button>
                <Badge variant={st.variant}>{st.text}</Badge>
                {stream?.lastSeen && (
                  <span className="text-xs text-muted">
                    Frame terakhir: {new Date(stream.lastSeen).toLocaleTimeString("id-ID")}
                  </span>
                )}
              </div>
              {!stream?.configured && (
                <p className="text-xs text-muted">Simpan pengaturan dulu sebelum menekan Mulai.</p>
              )}
              {notice && (
                <p className={`text-sm ${notice.ok ? "text-safe" : "text-danger"}`} role="status">
                  {notice.text}
                </p>
              )}
              {stream && stream.logs.length > 0 && (
                <details className="text-xs text-muted">
                  <summary className="cursor-pointer">Log worker</summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-ink/[0.04] p-2">
                    {stream.logs.join("\n")}
                  </pre>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
