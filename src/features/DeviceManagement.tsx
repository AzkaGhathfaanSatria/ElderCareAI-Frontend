"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, type FormEvent, useState } from "react";
import Footer from "../components/layout/Footer";
import ManagementHeader from "../components/layout/ManagementHeader";
import TopNav from "../components/layout/TopNav";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyStateMessage from "../components/ui/EmptyStateMessage";
import { SelectField } from "../components/ui/SelectField";
import TextField from "../components/ui/TextField";
import CameraStreamPanel from "../components/devices/CameraStreamPanel";
import { parseRtsp } from "../components/devices/rtsp";
import {
  getDevices,
  getElders,
  createWearable,
  createCamera,
  pairDevice,
  rotateWearableKey,
  saveCameraStream,
  startCameraStream,
  updateDevice,
  type BackendDevice,
} from "../services/backendApi";

type DeviceType = "Wearable" | "Kamera CCTV";

const emptyForm = {
  deviceId: "",
  type: "Wearable" as DeviceType,
  assignedTo: "",
  rtsp: "",
  host: "",
  port: "",
  username: "",
  password: "",
  path: "",
  fps: "1",
};

function DeviceManagement() {
  const queryClient = useQueryClient();
  const devicesQuery = useQuery({ queryKey: ["devices"], queryFn: getDevices });
  const eldersQuery = useQuery({ queryKey: ["elders"], queryFn: getElders });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const devices = devicesQuery.data ?? [];
  const connectedCount = devices.filter((device) =>
    ["terhubung", "connected", "aktif", "online"].includes((device.status ?? "").toLowerCase()),
  ).length;

  // Device key hanya tampil sekali (backend menyimpan hash-nya saja), jadi ditampilkan di kotak khusus + tombol salin.
  const [newKey, setNewKey] = useState<{ label: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [rotatingId, setRotatingId] = useState("");

  // Edit perangkat (tanpa perlu mendaftarkan ulang lansia)
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ deviceId: "", lokasi: "", elderId: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const startEdit = (device: BackendDevice) => {
    setError("");
    setSuccess("");
    setEditingId(device.id);
    setEditForm({
      deviceId: String(device.deviceId ?? device.name ?? ""),
      lokasi: device.location && device.location !== "Belum diatur" ? device.location : "",
      elderId: device.elderId ?? "",
    });
  };

  const saveEdit = async (device: BackendDevice) => {
    if (!editForm.deviceId.trim()) return setError("Nama / ID perangkat wajib diisi.");
    setError("");
    setSavingEdit(true);
    try {
      const isCamera = /^c-\d+$/.test(device.id);
      await updateDevice(device.id, {
        deviceId: editForm.deviceId.trim(),
        ...(isCamera && editForm.lokasi.trim() ? { lokasi: editForm.lokasi.trim() } : {}),
        ...(editForm.elderId && editForm.elderId !== device.elderId
          ? { elderId: editForm.elderId }
          : {}),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["devices"] }),
        queryClient.invalidateQueries({ queryKey: ["elder-care"] }),
      ]);
      setEditingId("");
      setSuccess("Perangkat berhasil diperbarui.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memperbarui perangkat.");
    } finally {
      setSavingEdit(false);
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Tidak bisa menyalin otomatis. Blok dan salin key secara manual.");
    }
  };

  const handleRotateKey = async (deviceId: string, label: string) => {
    if (
      !window.confirm(
        `Buat key baru untuk ${label}? Key lama langsung berhenti berlaku dan perangkat harus diperbarui.`,
      )
    )
      return;
    setError("");
    setRotatingId(deviceId);
    try {
      const key = await rotateWearableKey(deviceId);
      setNewKey({ label, key });
      setCopied(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat device key baru.");
    } finally {
      setRotatingId("");
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => {
      if (name === "rtsp") {
        const parsed = parseRtsp(value);
        return parsed ? { ...current, rtsp: value, ...parsed } : { ...current, rtsp: value };
      }
      return { ...current, [name]: value };
    });
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.deviceId.trim()) return setError("ID perangkat wajib diisi.");
    if (!form.assignedTo) return setError("Lansia tujuan wajib dipilih.");
    const elder = eldersQuery.data?.find((item) => item.id === form.assignedTo);
    if (!elder) return setError("Lansia tidak ditemukan.");
    const isCamera = form.type === "Kamera CCTV";
    const fps = Number(form.fps);
    if (isCamera && form.host.trim() && !(fps >= 0.2 && fps <= 2))
      return setError("Frame per detik harus antara 0,2 dan 2.");
    try {
      const created =
        form.type === "Wearable"
          ? await createWearable({
              deviceId: form.deviceId.trim(),
              id_wearable: form.deviceId.trim(),
              elderId: elder.id,
              id_lansia: elder.id,
            })
          : await createCamera({
              deviceId: form.deviceId.trim(),
              id_kamera: form.deviceId.trim(),
              elderId: elder.id,
              id_lansia: elder.id,
            });
      const createdId = created.id || form.deviceId.trim();
      await pairDevice(createdId, elder.id);
      // Kamera: kalau IP diisi, langsung simpan pengaturan stream dan nyalakan. Gagal di sini tidak membatalkan pendaftaran.
      let streamNote = "";
      if (isCamera && form.host.trim()) {
        try {
          await saveCameraStream(createdId, {
            host: form.host.trim(),
            port: form.port ? Number(form.port) : null,
            username: form.username,
            password: form.password,
            path: form.path.trim(),
            fps,
          });
          await startCameraStream(createdId);
          streamNote = " Stream kamera sedang disambungkan, cek statusnya di Pengaturan stream.";
        } catch (e) {
          streamNote = ` Namun stream belum tersambung (${e instanceof Error ? e.message : "gagal"}). Perbaiki lewat tombol Pengaturan stream di daftar.`;
        }
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["devices"] }),
        queryClient.invalidateQueries({ queryKey: ["elder-care"] }),
      ]);
      setForm(emptyForm);
      setIsFormOpen(false);
      setSuccess(
        `${form.type} berhasil didaftarkan dan dipasangkan ke ${elder.name}.${streamNote}`,
      );
      if (created.deviceKey) {
        setNewKey({ label: `${form.type} ${form.deviceId.trim()}`, key: created.deviceKey });
        setCopied(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mendaftarkan perangkat.");
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <TopNav />
      <main className="min-w-0">
        <div className="p-4 sm:p-6 lg:p-8">
          <ManagementHeader
            title="Manajemen Perangkat"
            description="Kelola wearable dan kamera CCTV yang terhubung ke sistem."
            isFormOpen={isFormOpen}
            onToggleForm={() => {
              setError("");
              setSuccess("");
              setIsFormOpen((open) => !open);
            }}
            openLabel="+ Pasangkan Perangkat"
          />
          {success && (
            <div
              className="mb-5 rounded-lg border-l-4 border-safe bg-safe/8 p-4 text-sm text-safe"
              role="status"
            >
              {success}
            </div>
          )}
          {newKey && (
            <div className="mb-5 rounded-lg border-l-4 border-warn bg-warn/8 p-4" role="status">
              <p className="text-sm font-semibold text-ink">Device key untuk {newKey.label}</p>
              <p className="mt-1 text-sm text-muted">
                Simpan sekarang. Key ini hanya ditampilkan sekali dan dipakai perangkat pada header{" "}
                <code>X-Device-Key</code>.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all rounded-md border border-border bg-paper px-3 py-2 text-xs text-ink select-all">
                  {newKey.key}
                </code>
                <Button variant="secondary" size="sm" onClick={copyKey}>
                  {copied ? "Tersalin ✓" : "Salin"}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setNewKey(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
          {error && (
            <div
              className="mb-5 rounded-lg border border-danger/25 bg-danger/6 px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {error}
            </div>
          )}
          {isFormOpen && (
            <Card className="mb-6 p-5 sm:p-6">
              <h2 className="mb-4 font-serif text-base text-ink">
                Daftarkan & Pasangkan Perangkat
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField
                    id="deviceId"
                    name="deviceId"
                    label="ID Perangkat"
                    value={form.deviceId}
                    onChange={handleChange}
                    placeholder="Contoh: WRB-030"
                  />
                  <SelectField
                    id="type"
                    name="type"
                    label="Tipe Perangkat"
                    value={form.type}
                    onChange={handleChange}
                  >
                    <option value="Wearable">Wearable</option>
                    <option value="Kamera CCTV">Kamera CCTV</option>
                  </SelectField>
                  <SelectField
                    id="assignedTo"
                    name="assignedTo"
                    label="Dipasangkan ke Lansia"
                    value={form.assignedTo}
                    onChange={handleChange}
                  >
                    <option value="">Pilih lansia</option>
                    {(eldersQuery.data ?? []).map((elder) => (
                      <option key={elder.id} value={elder.id}>
                        {elder.name}
                      </option>
                    ))}
                  </SelectField>
                </div>
                {form.type === "Kamera CCTV" && (
                  <div className="space-y-4 rounded-xl border border-border p-4">
                    <p className="text-sm font-semibold text-ink-soft">
                      Koneksi stream kamera (RTSP)
                    </p>
                    <p className="-mt-2 text-xs text-muted">
                      Opsional. Jika IP diisi, stream langsung disambungkan setelah disimpan. Bisa
                      juga diisi nanti lewat Pengaturan stream.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        id="host"
                        name="host"
                        label="IP kamera"
                        value={form.host}
                        onChange={handleChange}
                        placeholder="192.168.1.7"
                      />
                      <TextField
                        id="fps"
                        name="fps"
                        type="number"
                        min={0.2}
                        max={2}
                        step={0.1}
                        label="Frame per detik"
                        value={form.fps}
                        onChange={handleChange}
                      />
                      <TextField
                        id="username"
                        name="username"
                        label="Username"
                        value={form.username}
                        onChange={handleChange}
                        autoComplete="off"
                      />
                      <TextField
                        id="password"
                        name="password"
                        type="password"
                        label="Password"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                      />
                    </div>
                    <p className="text-xs text-muted">
                      Port dan alamat stream dicari otomatis saat disimpan.
                    </p>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted">
                        Pengaturan lanjutan (biasanya tidak perlu diisi)
                      </summary>
                      <div className="mt-3 space-y-4">
                        <TextField
                          id="rtsp"
                          name="rtsp"
                          label="Tempel URL RTSP (opsional)"
                          value={form.rtsp}
                          onChange={handleChange}
                          placeholder="rtsp://user:password@192.168.1.7:8554/Streaming/Channels/101"
                          autoComplete="off"
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextField
                            id="port"
                            name="port"
                            type="number"
                            label="Port (kosong = otomatis)"
                            value={form.port}
                            onChange={handleChange}
                            placeholder="otomatis"
                          />
                          <TextField
                            id="path"
                            name="path"
                            label="Path stream (kosong = otomatis)"
                            value={form.path}
                            onChange={handleChange}
                            placeholder="otomatis"
                          />
                        </div>
                      </div>
                    </details>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button type="submit" variant="accent" size="sm" disabled={eldersQuery.isPending}>
                    Simpan & Pair
                  </Button>
                </div>
              </form>
            </Card>
          )}
          <Card className="p-6">
            <header className="mb-4">
              <h2 className="font-serif text-lg text-ink">Daftar Perangkat</h2>
              <p className="mt-1 text-sm text-muted">
                {connectedCount} dari {devices.length} perangkat terhubung. Status "Terhubung"
                ditentukan dari data terakhir yang diterima perangkat.
              </p>
            </header>
            {devicesQuery.isPending ? (
              <p className="text-sm text-muted">Memuat perangkat...</p>
            ) : devices.length ? (
              <ol className="divide-y divide-border">
                {devices.map((device) => {
                  const connected = ["terhubung", "connected", "aktif", "online"].includes(
                    (device.status ?? "").toLowerCase(),
                  );
                  return (
                    <li key={device.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-ink-soft">
                            {device.deviceId ?? device.name ?? device.id} ·{" "}
                            {device.type ?? device.kind ?? "Perangkat"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {device.elderName
                              ? `Lansia: ${device.elderName}`
                              : "Belum ada nama lansia"}
                            {device.lastSeen ? ` · Terakhir terlihat ${device.lastSeen}` : ""}
                            {typeof device.battery === "number"
                              ? ` · Baterai ${device.battery}%`
                              : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              editingId === device.id ? setEditingId("") : startEdit(device)
                            }
                          >
                            {editingId === device.id ? "Batal edit" : "Edit"}
                          </Button>
                          {
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={rotatingId === device.id}
                              onClick={() =>
                                handleRotateKey(
                                  device.id,
                                  String(device.deviceId ?? device.name ?? device.id),
                                )
                              }
                            >
                              {rotatingId === device.id ? "Membuat..." : "Buat key baru"}
                            </Button>
                          }
                          <Badge variant={connected ? "success" : "danger"}>
                            {device.status ?? "Terputus"}
                          </Badge>
                        </div>
                      </div>
                      {editingId === device.id && (
                        <div className="mt-3 space-y-4 rounded-xl border border-border p-4">
                          <div className="grid gap-4 sm:grid-cols-3">
                            <TextField
                              id={`edit-name-${device.id}`}
                              label={
                                /^c-\d+$/.test(device.id) ? "Nama kamera" : "ID / nama perangkat"
                              }
                              value={editForm.deviceId}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, deviceId: e.target.value }))
                              }
                            />
                            {/^c-\d+$/.test(device.id) && (
                              <TextField
                                id={`edit-loc-${device.id}`}
                                label="Lokasi kamera"
                                value={editForm.lokasi}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, lokasi: e.target.value }))
                                }
                                placeholder="Contoh: Ruang tamu"
                              />
                            )}
                            <SelectField
                              id={`edit-elder-${device.id}`}
                              label="Lansia"
                              value={editForm.elderId}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, elderId: e.target.value }))
                              }
                            >
                              {(eldersQuery.data ?? []).map((elder) => (
                                <option key={elder.id} value={elder.id}>
                                  {elder.name}
                                </option>
                              ))}
                            </SelectField>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setEditingId("")}>
                              Batal
                            </Button>
                            <Button
                              variant="accent"
                              size="sm"
                              disabled={savingEdit}
                              onClick={() => saveEdit(device)}
                            >
                              {savingEdit ? "Menyimpan..." : "Simpan perubahan"}
                            </Button>
                          </div>
                        </div>
                      )}
                      {/^c-\d+$/.test(device.id) && <CameraStreamPanel deviceId={device.id} />}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyStateMessage message="Belum ada perangkat terdaftar." />
            )}
          </Card>
        </div>
        <Footer />
      </main>
    </div>
  );
}
export default DeviceManagement;
