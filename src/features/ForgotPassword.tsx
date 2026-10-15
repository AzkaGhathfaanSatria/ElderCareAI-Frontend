"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import TextField from "../components/ui/TextField";
import { requestPasswordReset } from "../services/backendApi";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setMessage("");
    if (!email.trim()) return setError("Email wajib diisi.");
    try { await requestPasswordReset(email.trim()); setMessage("Jika email terdaftar, instruksi reset password akan dikirim."); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal meminta reset password."); }
  };
  return <main className="min-h-screen bg-paper px-4 py-12"><div className="mx-auto max-w-md"><Card className="p-6"><h1 className="font-serif text-2xl text-ink">Lupa Password</h1><p className="mt-2 text-sm leading-6 text-muted">Masukkan email akun. Jika terdaftar, kami kirim tautan untuk membuat password baru (berlaku 1 jam).</p>{message&&<div className="mt-4 rounded-lg bg-safe/8 p-3 text-sm text-safe">{message}</div>}{error&&<div className="mt-4 rounded-lg bg-danger/6 p-3 text-sm text-danger">{error}</div>}<form onSubmit={submit} className="mt-5 space-y-4"><TextField id="email" name="email" label="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email"/><Button type="submit" variant="accent" size="md">Kirim Instruksi Reset</Button></form><Button type="button" variant="secondary" size="sm" className="mt-4" onClick={()=>router.push("/login")}>← Kembali ke Login</Button></Card></div></main>;
}
