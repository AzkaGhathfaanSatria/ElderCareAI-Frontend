"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useState } from "react";
import Footer from "../components/layout/Footer";
import ManagementHeader from "../components/layout/ManagementHeader";
import TopNav from "../components/layout/TopNav";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyStateMessage from "../components/ui/EmptyStateMessage";
import TextField from "../components/ui/TextField";
import { useSession } from "../hooks/useSession";
import { getAccessGrants, getElders, createAccessGrant, revokeAccessGrant } from "../services/backendApi";
import { getInitials } from "../lib/initials";
import { type AccessGrantInput, AccessGrantSchema } from "../schemas/accessGrantSchema";

const emptyForm: AccessGrantInput = { name: "", email: "", specialization: "" };

function AccessManagement() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionQuery = useSession();
  const eldersQuery = useQuery({ queryKey: ["elders"], queryFn: getElders });
  const elder = eldersQuery.data?.[0];
  const grantsQuery = useQuery({
    queryKey: ["access-grants", elder?.id],
    queryFn: () => getAccessGrants(elder?.id ?? ""),
    enabled: Boolean(elder?.id),
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<AccessGrantInput>(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (sessionQuery.data && sessionQuery.data.role !== "keluarga") {
    return <div className="min-h-screen bg-paper"><TopNav /><main className="flex min-h-[calc(100vh-113px)] items-center justify-center p-4"><Card className="max-w-md p-8 text-center"><h1 className="font-serif text-lg text-ink">Tidak Punya Akses</h1><p className="mt-2 text-sm leading-6 text-muted">Halaman ini hanya bisa dibuka oleh Keluarga/Caregiver.</p><Button variant="primary" size="sm" className="mt-5" onClick={() => router.push("/dashboard")}>Kembali ke Dashboard</Button></Card></main></div>;
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const result = AccessGrantSchema.safeParse(form);
    if (!result.success) return setError(result.error.issues[0]?.message ?? "Data tidak valid.");
    if (!elder?.id) return setError("Belum ada lansia yang dapat diberi izin akses.");
    try {
      await createAccessGrant(elder.id, { email: result.data.email });
      await queryClient.invalidateQueries({ queryKey: ["access-grants", elder.id] });
      setForm(emptyForm);
      setIsFormOpen(false);
      setSuccess(`Akses untuk ${result.data.email} berhasil diberikan.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memberikan akses."); }
  };

  const toggleStatus = async (id: string, status: string | undefined) => {
    if (!elder?.id) return;
    try {
      if ((status ?? "").toLowerCase() === "aktif") await revokeAccessGrant(elder.id, id);
      else throw new Error("Backend hanya menyediakan pencabutan grant pada kontrak saat ini.");
      await queryClient.invalidateQueries({ queryKey: ["access-grants", elder.id] });
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal mengubah izin akses."); }
  };

  const grants = grantsQuery.data ?? [];
  const activeCount = grants.filter((grant) => (grant.status ?? "").toLowerCase() === "aktif").length;

  return <div className="min-h-screen bg-paper"><TopNav hasNotification={false} /><main className="min-w-0"><div className="p-4 sm:p-6 lg:p-8">
    <ManagementHeader title="Pengaturan Izin Akses" description={<>Kelola tenaga medis yang boleh melihat data kesehatan {elder?.name ?? "lansia"}.</>} isFormOpen={isFormOpen} onToggleForm={() => { setError(""); setSuccess(""); setIsFormOpen((open) => !open); }} openLabel="+ Beri Akses Baru" />
    {success && <div className="mb-5 rounded-lg border-l-4 border-safe bg-safe/8 p-4 text-sm text-safe" role="status">{success}</div>}
    {error && <div className="mb-5 rounded-lg border border-danger/25 bg-danger/6 px-4 py-3 text-sm text-danger" role="alert">{error}</div>}
    {isFormOpen && <Card className="mb-6 p-5 sm:p-6"><h2 className="mb-4 font-serif text-base text-ink">Beri Akses Tenaga Medis</h2><form onSubmit={handleSubmit} noValidate className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><TextField id="name" name="name" label="Nama Tenaga Medis" value={form.name} onChange={handleChange} placeholder="Nama (untuk tampilan)" /><TextField id="specialization" name="specialization" label="Spesialisasi/Peran" value={form.specialization} onChange={handleChange} placeholder="Dokter Geriatri" /><TextField id="email" name="email" label="Email Terdaftar" type="email" value={form.email} onChange={handleChange} placeholder="contoh@klinik.id" wrapperClassName="sm:col-span-2" /></div><div className="flex justify-end"><Button type="submit" variant="accent" size="sm" disabled={!elder?.id}>Simpan Akses</Button></div></form></Card>}
    <Card className="p-6"><header className="mb-4"><h2 className="font-serif text-lg text-ink">Daftar Tenaga Medis</h2><p className="mt-1 text-sm text-muted">{activeCount} dari {grants.length} tenaga medis memiliki akses aktif.</p></header>{grantsQuery.isPending ? <p className="text-sm text-muted">Memuat izin akses...</p> : grants.length ? <ol className="divide-y divide-border">{grants.map((grant) => { const active=(grant.status??"").toLowerCase()==="aktif"; const name=grant.name??grant.email??"Tenaga medis"; return <li key={grant.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/12 font-serif text-sm text-accent-dark">{getInitials(name)}</div><div><p className="text-sm font-semibold text-ink-soft">{name}</p><p className="mt-0.5 text-xs text-muted">{grant.specialization ?? "Tenaga Medis"} · {grant.email ?? "-"}</p><p className="mt-0.5 text-xs text-muted">{grant.grantedAt ? `Diberi akses ${grant.grantedAt}` : "Akses aktif"}</p></div></div><div className="flex items-center gap-3"><Badge variant={active?"success":"neutral"}>{active?"Aktif":"Dicabut"}</Badge><Button variant={active?"secondary":"accent"} size="sm" onClick={() => toggleStatus(grant.id, grant.status)}>{active?"Cabut Akses":"Aktifkan Kembali"}</Button></div></li>})}</ol> : <EmptyStateMessage message="Belum ada tenaga medis yang diberi akses." />}</Card>
  </div><Footer /></main></div>;
}
export default AccessManagement;
