"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import TextField from "../components/ui/TextField";
import { resetPassword } from "../services/backendApi";

export default function ResetPassword() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (password !== confirm) return setError("Konfirmasi password tidak sama.");
    setBusy(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset password gagal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper px-4 py-12">
      <div className="mx-auto max-w-md">
        <Link
          href="/login"
          className="group mb-5 inline-flex w-fit items-center gap-1.5 rounded-full text-sm font-medium text-muted transition-colors duration-200 hover:text-ink focus-visible:text-ink focus-visible:outline-none"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          >
            ←
          </span>
          Kembali ke login
        </Link>

        <Card className="p-6">
          <h1 className="font-serif text-2xl text-ink">Buat Password Baru</h1>

          {!token ? (
            <>
              <div className="mt-4 rounded-lg bg-danger/6 p-3 text-sm text-danger" role="alert">
                Tautan reset tidak lengkap. Minta tautan baru dari halaman Lupa Password.
              </div>
              <Button
                type="button"
                variant="accent"
                size="md"
                className="mt-4"
                onClick={() => router.push("/forgot-password")}
              >
                Minta Tautan Baru
              </Button>
            </>
          ) : done ? (
            <div className="mt-4 rounded-lg bg-safe/8 p-3 text-sm text-safe" role="status">
              Password berhasil diubah. Mengarahkan ke halaman login...
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm leading-6 text-muted">
                Masukkan password baru untuk akunmu (minimal 8 karakter).
              </p>
              {error && (
                <div className="mt-4 rounded-lg bg-danger/6 p-3 text-sm text-danger" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={submit} className="mt-5 space-y-4">
                <TextField
                  id="password"
                  name="password"
                  label="Password baru"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <TextField
                  id="confirm"
                  name="confirm"
                  label="Ulangi password baru"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
                <Button type="submit" variant="accent" size="md" disabled={busy}>
                  {busy ? "Menyimpan..." : "Simpan Password"}
                </Button>
              </form>
            </>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/login")}
          >
            ← Kembali ke Login
          </Button>
        </Card>
      </div>
    </main>
  );
}
