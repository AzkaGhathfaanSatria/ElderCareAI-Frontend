"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import AccountPageShell from "../components/layout/AccountPageShell";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import TextField from "../components/ui/TextField";
import { useSession } from "../hooks/useSession";
import { getInitials } from "../lib/initials";
import { roleLabel } from "../lib/userDisplay";
import { requestPasswordReset, updateMe } from "../services/backendApi";

function Profile() {
  const sessionQuery = useSession();
  const queryClient = useQueryClient();
  const user = sessionQuery.data;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => { if (user) { setName(user.name); setEmail(user.email); } }, [user]);

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const updated = await updateMe({ name: name.trim(), email: email.trim() });
      queryClient.setQueryData(["session"], updated);
      setSavedMessage("Perubahan profil berhasil disimpan.");
    } catch (e) { setSavedMessage(e instanceof Error ? e.message : "Gagal memperbarui profil."); }
  };

  const handleResetRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return setSavedMessage("Email akun wajib diisi.");
    try {
      await requestPasswordReset(email);
      setSavedMessage("Jika email terdaftar, instruksi reset password akan dikirim.");
    } catch (e) { setSavedMessage(e instanceof Error ? e.message : "Gagal meminta reset password."); }
  };

  return <AccountPageShell title="Profil" message={savedMessage}>
    <Card className="mb-6 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xl font-bold text-accent-dark">{user ? getInitials(user.name) : "…"}</div><div className="min-w-0"><h2 className="font-serif text-lg text-ink">{user?.name ?? "Memuat..."}</h2><p className="mt-0.5 text-sm text-muted">{user?.email}</p>{user && <Badge variant="info" className="mt-2">{roleLabel[user.role]}</Badge>}</div></Card>
    <Card className="mb-6 p-6"><header className="mb-5"><h2 className="font-serif text-lg text-ink">Informasi Akun</h2><p className="mt-1 text-sm text-muted">Perbarui nama dan email akunmu.</p></header><form onSubmit={handleSaveProfile} className="space-y-4"><TextField id="name" name="name" label="Nama Lengkap" value={name} onChange={(e)=>setName(e.target.value)} /><TextField id="email" name="email" label="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} /><Button type="submit" variant="accent" size="md">Simpan Perubahan</Button></form></Card>
    <Card className="p-6"><header className="mb-5"><h2 className="font-serif text-lg text-ink">Reset Password</h2><p className="mt-1 text-sm text-muted">Untuk mengganti password, kami kirim tautan reset ke email akunmu.</p></header><form onSubmit={handleResetRequest} className="space-y-4"><TextField id="resetEmail" name="resetEmail" label="Email Akun" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} /><Button type="submit" variant="primary" size="md">Kirim Instruksi Reset</Button></form></Card>
  </AccountPageShell>;
}
export default Profile;
