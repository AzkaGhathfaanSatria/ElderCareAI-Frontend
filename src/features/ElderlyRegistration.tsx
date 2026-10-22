"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useState } from "react";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { SelectField, TextAreaField } from "../components/ui/SelectField";
import TextField from "../components/ui/TextField";
import { parseRtsp } from "../components/devices/rtsp";
import { useElderlyMutation } from "../hooks/useElderlyMutation";
import {
  type ElderlyRegistrationInput,
  ElderlyRegistrationSchema,
} from "../schemas/elderlyRegistrationSchema";

function ElderlyRegistration() {
  const router = useRouter();

  const elderlyMutation = useElderlyMutation();

  const [form, setForm] = useState<ElderlyRegistrationInput>({
    name: "",
    birthDate: "",
    address: "",
    healthNotes: "",
    wearableType: "",
    wearableId: "",
    cameraType: "",
    cameraId: "",
    rtsp: "",
    cameraHost: "",
    cameraPort: "",
    cameraUser: "",
    cameraPassword: "",
    cameraPath: "",
    cameraFps: "1",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deviceKeys, setDeviceKeys] = useState<{ label: string; key: string }[]>([]);
  const [copiedKey, setCopiedKey] = useState("");

  const copyDeviceKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(""), 2000);
    } catch {
      setError("Tidak bisa menyalin otomatis. Blok dan salin key secara manual.");
    }
  };

  // Setelah berhasil dan key ditampilkan, form dikunci supaya tidak terkirim dua kali.
  const isLoading = elderlyMutation.isPending || deviceKeys.length > 0;

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === "rtsp") {
        // URL RTSP lengkap dipecah otomatis ke kolom IP, port, user, password, path
        const p = parseRtsp(value);
        return p
          ? {
              ...current,
              rtsp: value,
              cameraHost: p.host,
              cameraPort: p.port,
              cameraUser: p.username,
              cameraPassword: p.password,
              cameraPath: p.path,
            }
          : { ...current, rtsp: value };
      }
      return { ...current, [name]: value };
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const result = ElderlyRegistrationSchema.safeParse(form);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Data registrasi lansia tidak valid.");

      return;
    }

    const fps = Number(result.data.cameraFps);
    if (result.data.cameraHost && !(fps >= 0.2 && fps <= 2)) {
      setError("Frame per detik harus antara 0,2 dan 2.");
      return;
    }

    try {
      const { deviceKeys: keys, streamNote } = await elderlyMutation.mutateAsync(result.data);

      if (keys.length > 0) {
        // Jangan redirect otomatis: key hanya tampil sekali dan harus sempat disalin.
        setDeviceKeys(keys);
        setSuccess(
          `Data lansia berhasil didaftarkan. Simpan device key di bawah ini sekarang, hanya ditampilkan sekali. ${streamNote}`.trim(),
        );
        return;
      }

      setSuccess(
        `Data lansia berhasil didaftarkan. ${streamNote} Mengarahkan ke halaman data lansia...`.replace(
          "  ",
          " ",
        ),
      );

      window.setTimeout(
        () => {
          router.push("/elderly");
        },
        streamNote ? 3500 : 1200,
      );
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Gagal menyimpan data lansia. Silakan coba lagi.",
      );
    }
  };

  return (
    <main className="relative min-h-screen bg-paper">
      {/* Aksen dekoratif — senada dengan halaman Login & Register */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[repeating-linear-gradient(90deg,var(--color-accent)_0,var(--color-accent)_10px,transparent_10px,transparent_20px)] opacity-60"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-6">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => router.push("/elderly")}
            aria-label="Kembali ke data lansia"
          >
            ← Kembali
          </Button>

          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink font-serif text-sm text-paper shadow-sm">
                E
              </span>

              <span className="text-sm font-semibold text-accent-dark">ElderCare AI</span>
            </div>

            <h1 className="font-serif text-2xl text-ink sm:text-3xl">Tambah Data Lansia</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Lengkapi informasi lansia serta perangkat wearable dan kamera CCTV yang akan digunakan
              untuk pemantauan.
            </p>
          </div>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Error */}
          {error && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border border-danger/25 bg-danger/6 px-4 py-3 text-sm text-danger"
              role="alert"
              aria-live="polite"
            >
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/15 text-xs font-bold"
                aria-hidden="true"
              >
                !
              </span>

              <p>{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border border-safe/25 bg-safe/10 px-4 py-3 text-sm text-safe"
              role="status"
              aria-live="polite"
            >
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-safe/15 text-xs font-bold"
                aria-hidden="true"
              >
                ✓
              </span>

              <p>{success}</p>
            </div>
          )}

          {deviceKeys.length > 0 && (
            <div
              className="mb-6 space-y-3 rounded-xl border border-warn/40 bg-warn/8 p-4"
              role="status"
            >
              {deviceKeys.map((item) => (
                <div key={item.key}>
                  <p className="text-sm font-semibold text-ink">Device key {item.label}</p>
                  <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <code className="min-w-0 flex-1 break-all rounded-md border border-border bg-paper px-3 py-2 text-xs text-ink select-all">
                      {item.key}
                    </code>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => copyDeviceKey(item.key)}
                    >
                      {copiedKey === item.key ? "Tersalin ✓" : "Salin"}
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="accent"
                size="sm"
                onClick={() => router.push("/elderly")}
              >
                Lanjut ke Data Lansia
              </Button>
            </div>
          )}

          <div className="space-y-6">
            {/* ========================= */}
            {/* DATA LANSIA */}
            {/* ========================= */}
            <Card className="overflow-hidden">
              <div className="border-b border-border px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink/8 font-serif font-bold text-ink-soft">
                    01
                  </div>

                  <div>
                    <h2 className="font-serif text-base text-ink">Data Lansia</h2>

                    <p className="mt-1 text-xs text-muted">
                      Informasi dasar lansia yang akan dipantau.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <TextField
                  id="name"
                  name="name"
                  label="Nama Lengkap"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap lansia"
                  autoComplete="name"
                  wrapperClassName="sm:col-span-2"
                />

                <TextField
                  id="birthDate"
                  name="birthDate"
                  label="Tanggal Lahir"
                  type="date"
                  value={form.birthDate}
                  onChange={handleChange}
                />

                <TextField
                  id="address"
                  name="address"
                  label="Alamat"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Masukkan alamat lansia"
                  autoComplete="street-address"
                />

                <TextAreaField
                  id="healthNotes"
                  name="healthNotes"
                  label="Catatan Kesehatan"
                  value={form.healthNotes}
                  onChange={handleChange}
                  placeholder="Masukkan riwayat atau catatan kesehatan yang perlu diperhatikan"
                  rows={4}
                  wrapperClassName="sm:col-span-2"
                />
              </div>
            </Card>

            {/* ========================= */}
            {/* WEARABLE */}
            {/* ========================= */}
            <Card className="overflow-hidden">
              <div className="border-b border-border px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/12 font-serif font-bold text-accent-dark">
                    02
                  </div>

                  <div>
                    <h2 className="font-serif text-base text-ink">Perangkat Wearable</h2>

                    <p className="mt-1 text-xs text-muted">
                      Hubungkan perangkat wearable untuk memantau data fisiologis.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <SelectField
                  id="wearableType"
                  name="wearableType"
                  label="Tipe Wearable"
                  value={form.wearableType}
                  onChange={handleChange}
                >
                  <option value="">Pilih tipe perangkat</option>
                  <option value="smartwatch">Smartwatch</option>
                  <option value="fitness_band">Fitness Band</option>
                  <option value="health_tracker">Health Tracker</option>
                </SelectField>

                <TextField
                  id="wearableId"
                  name="wearableId"
                  label="ID Perangkat"
                  type="text"
                  value={form.wearableId}
                  onChange={handleChange}
                  placeholder="Contoh: WRB-001"
                />
              </div>
            </Card>

            {/* ========================= */}
            {/* KAMERA CCTV */}
            {/* ========================= */}
            <Card className="overflow-hidden">
              <div className="border-b border-border px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-safe/12 font-serif font-bold text-safe">
                    03
                  </div>

                  <div>
                    <h2 className="font-serif text-base text-ink">Kamera CCTV</h2>

                    <p className="mt-1 text-xs text-muted">
                      Hubungkan kamera CCTV untuk deteksi visual jatuh di lingkungan rumah.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <SelectField
                  id="cameraType"
                  name="cameraType"
                  label="Tipe Kamera"
                  value={form.cameraType}
                  onChange={handleChange}
                >
                  <option value="">Pilih tipe kamera</option>
                  <option value="cctv">Kamera CCTV</option>
                </SelectField>

                <TextField
                  id="cameraId"
                  name="cameraId"
                  label="ID Kamera"
                  type="text"
                  value={form.cameraId}
                  onChange={handleChange}
                  placeholder="Contoh: CAM-001"
                />
              </div>

              <div className="space-y-4 border-t border-border p-5 sm:p-6">
                <div>
                  <p className="text-sm font-semibold text-ink">Koneksi stream kamera (RTSP)</p>
                  <p className="mt-1 text-xs text-muted">
                    Opsional. Jika IP diisi, stream langsung disambungkan setelah data disimpan.
                    Bisa juga diisi nanti di halaman Perangkat.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id="cameraHost"
                    name="cameraHost"
                    label="IP kamera"
                    type="text"
                    value={form.cameraHost}
                    onChange={handleChange}
                    placeholder="192.168.1.7"
                  />
                  <TextField
                    id="cameraFps"
                    name="cameraFps"
                    label="Frame per detik"
                    type="number"
                    min={0.2}
                    max={2}
                    step={0.1}
                    value={form.cameraFps}
                    onChange={handleChange}
                  />
                  <TextField
                    id="cameraUser"
                    name="cameraUser"
                    label="Username"
                    type="text"
                    value={form.cameraUser}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                  <TextField
                    id="cameraPassword"
                    name="cameraPassword"
                    label="Password"
                    type="password"
                    value={form.cameraPassword}
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
                      type="text"
                      value={form.rtsp}
                      onChange={handleChange}
                      placeholder="rtsp://user:password@192.168.1.7:8554/Streaming/Channels/101"
                      autoComplete="off"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        id="cameraPort"
                        name="cameraPort"
                        label="Port (kosong = otomatis)"
                        type="number"
                        value={form.cameraPort}
                        onChange={handleChange}
                        placeholder="otomatis"
                      />
                      <TextField
                        id="cameraPath"
                        name="cameraPath"
                        label="Path stream (kosong = otomatis)"
                        type="text"
                        value={form.cameraPath}
                        onChange={handleChange}
                        placeholder="otomatis"
                      />
                    </div>
                  </div>
                </details>
              </div>
            </Card>

            {/* ========================= */}
            {/* ACTION */}
            {/* ========================= */}
            <Card className="p-5 sm:p-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isLoading}
                  onClick={() => router.push("/elderly")}
                >
                  Batal
                </Button>

                <Button
                  type="submit"
                  variant="accent"
                  disabled={isLoading}
                  className="min-w-40 !rounded-xl"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Data Lansia"}
                </Button>
              </div>
            </Card>
          </div>
        </form>

        <footer className="mt-6 text-center">
          <p className="text-xs text-muted">ElderCare AI — Smart Elderly Monitoring System</p>
        </footer>
      </div>
    </main>
  );
}

export default ElderlyRegistration;
