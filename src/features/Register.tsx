"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useState } from "react";

import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";
import { register } from "../services/backendApi";
import { type RegisterInput, RegisterSchema } from "../schemas/registerSchema";

function Register() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "keluarga",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleRoleChange = (role: RegisterInput["role"]) => {
    setForm((current) => ({
      ...current,
      role,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const result = RegisterSchema.safeParse(form);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Data registrasi tidak valid.");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
        role: result.data.role,
      });

      setSuccess("Registrasi berhasil. Mengarahkan ke halaman login...");

      window.setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Tidak dapat terhubung ke server. Periksa koneksi internet atau coba beberapa saat lagi."
          : err instanceof Error
            ? err.message
            : "Registrasi gagal. Coba lagi.",
      );
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-paper">
      {/* Aksen dekoratif — garis titik-titik ala catatan tangan, senada dengan halaman Login */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[repeating-linear-gradient(90deg,var(--color-accent)_0,var(--color-accent)_10px,transparent_10px,transparent_20px)] opacity-60"
        aria-hidden="true"
      />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:py-14">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-card-lg)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* Branding Section */}
          <section className="relative hidden overflow-hidden bg-ink p-10 text-paper lg:flex lg:flex-col lg:justify-between">
            <div
              className="absolute -right-24 -top-24 h-64 w-64 rounded-full border-[40px] border-paper/[0.06]"
              aria-hidden="true"
            />

            <div
              className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full border-[50px] border-paper/[0.06]"
              aria-hidden="true"
            />

            <div className="relative">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent font-serif text-lg text-white shadow-sm">
                  E
                </div>

                <span className="font-serif text-lg">ElderCare AI</span>
              </div>

              <p className="mb-3 text-sm font-medium text-accent/90">
                Bergabung dengan ElderCare AI
              </p>

              <h1 className="max-w-md font-serif text-3xl leading-tight">
                Mulai pantau kesehatan lansia dengan lebih mudah.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-6 text-paper/60">
                Buat akun untuk mengakses sistem pemantauan lansia, memahami perubahan aktivitas,
                dan mendapatkan peringatan dini.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="relative mt-10 space-y-3">
              <div className="flex items-center gap-4 rounded-2xl bg-paper/[0.07] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-lg text-accent">
                  +
                </div>

                <div>
                  <p className="text-sm font-semibold">Satu akun untuk monitoring</p>

                  <p className="mt-1 text-xs text-paper/55">
                    Akses informasi lansia dari satu tempat.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-paper/[0.07] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-lg text-accent">
                  ◉
                </div>

                <div>
                  <p className="text-sm font-semibold">Monitoring terintegrasi</p>

                  <p className="mt-1 text-xs text-paper/55">
                    Data wearable dan kamera CCTV dapat dipantau bersama.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-paper/[0.07] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-lg text-accent">
                  ♥
                </div>

                <div>
                  <p className="text-sm font-semibold">Mendukung perawatan lansia</p>

                  <p className="mt-1 text-xs text-paper/55">
                    Membantu keluarga dan tenaga medis mengambil tindakan lebih cepat.
                  </p>
                </div>
              </div>
            </div>

            <p className="relative mt-10 text-xs text-paper/40">ElderCare AI © 2026</p>
          </section>

          {/* Register Section */}
          <section className="flex items-center p-6 sm:p-10" aria-labelledby="register-title">
            <div className="w-full">
              {/* Mobile Logo */}
              <div className="mb-7 lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink font-serif text-lg text-paper shadow-sm">
                    E
                  </div>

                  <div>
                    <p className="font-serif text-lg leading-none text-ink">ElderCare AI</p>

                    <p className="mt-1 text-xs text-muted">Smart Elderly Monitoring System</p>
                  </div>
                </div>
              </div>

              {/* Heading */}
              <header className="mb-7">
                <p className="mb-2 text-sm font-medium text-accent-dark">Buat akun baru</p>

                <h2 id="register-title" className="font-serif text-2xl text-ink sm:text-3xl">
                  Daftarkan akun Anda
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Lengkapi informasi berikut untuk mulai menggunakan ElderCare AI.
                </p>
              </header>

              {/* Error */}
              {error && (
                <div
                  className="mb-5 flex items-start gap-3 rounded-xl border border-danger/25 bg-danger/6 px-4 py-3 text-sm text-danger"
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
                  className="mb-5 flex items-start gap-3 rounded-xl border border-safe/25 bg-safe/10 px-4 py-3 text-sm text-safe"
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

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Name */}
                <TextField
                  id="name"
                  name="name"
                  label="Nama Lengkap"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  autoComplete="name"
                />

                {/* Email */}
                <TextField
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contoh@email.com"
                  autoComplete="email"
                />

                {/* Password */}
                <TextField
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                />

                {/* Confirm Password */}
                <TextField
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Konfirmasi Password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Masukkan ulang password"
                  autoComplete="new-password"
                />

                {/* Role */}
                <fieldset>
                  <legend className="mb-2 block text-sm font-semibold text-ink-soft">
                    Pilih Role
                  </legend>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Family / Caregiver */}
                    <button
                      type="button"
                      onClick={() => handleRoleChange("keluarga")}
                      aria-pressed={form.role === "keluarga"}
                      className={`rounded-xl border p-4 text-left transition ${
                        form.role === "keluarga"
                          ? "border-accent bg-accent/8 ring-2 ring-accent/15"
                          : "border-border bg-paper hover:border-ink/25 hover:bg-surface"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                            form.role === "keluarga"
                              ? "bg-accent text-white"
                              : "bg-ink/8 text-muted"
                          }`}
                        >
                          K
                        </div>

                        {form.role === "keluarga" && (
                          <span className="text-sm font-bold text-accent-dark">✓</span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-ink-soft">Keluarga/Caregiver</p>

                      <p className="mt-1 text-xs leading-5 text-muted">
                        Memantau dan mengelola data lansia.
                      </p>
                    </button>

                    {/* Medical Staff */}
                    <button
                      type="button"
                      onClick={() => handleRoleChange("tenaga_medis")}
                      aria-pressed={form.role === "tenaga_medis"}
                      className={`rounded-xl border p-4 text-left transition ${
                        form.role === "tenaga_medis"
                          ? "border-accent bg-accent/8 ring-2 ring-accent/15"
                          : "border-border bg-paper hover:border-ink/25 hover:bg-surface"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                            form.role === "tenaga_medis"
                              ? "bg-accent text-white"
                              : "bg-ink/8 text-muted"
                          }`}
                        >
                          M
                        </div>

                        {form.role === "tenaga_medis" && (
                          <span className="text-sm font-bold text-accent-dark">✓</span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-ink-soft">Tenaga Medis</p>

                      <p className="mt-1 text-xs leading-5 text-muted">
                        Memantau kondisi dan peringatan lansia.
                      </p>
                    </button>
                  </div>
                </fieldset>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="accent"
                  className="w-full !rounded-full !py-3.5"
                  disabled={isLoading}
                >
                  {isLoading ? "Mendaftarkan..." : "Buat Akun"}
                </Button>
              </form>

              {/* Login */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted">
                  Sudah memiliki akun?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4 transition hover:text-accent-dark"
                  >
                    Masuk sekarang
                  </button>
                </p>
              </div>

              {/* Footer */}
              <p className="mt-7 text-center text-xs text-muted">
                Sistem Pemantauan Kesehatan Lansia
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Register;
