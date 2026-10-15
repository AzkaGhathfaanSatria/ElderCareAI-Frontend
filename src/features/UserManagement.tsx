"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import Footer from "../components/layout/Footer";
import ManagementHeader from "../components/layout/ManagementHeader";
import TopNav from "../components/layout/TopNav";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyStateMessage from "../components/ui/EmptyStateMessage";
import Select from "../components/ui/Select";
import TextField from "../components/ui/TextField";
import { getInitials } from "../lib/initials";
import { createUser, deleteUser, getUsers, updateUser } from "../services/backendApi";
import type { UserRole } from "../types/auth";

type RoleFilter = "Semua" | "Keluarga" | "Tenaga Medis" | "Admin";
const roleDisplay: Record<UserRole, string> = { keluarga: "Keluarga/Caregiver", tenaga_medis: "Tenaga Medis", admin: "Admin" };
const emptyForm = { name: "", email: "", password: "", role: "keluarga" as UserRole };

function UserManagement() {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: getUsers });
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("Semua");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const users = usersQuery.data ?? [];

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesRole = roleFilter === "Semua" || (roleFilter === "Keluarga" && user.role === "keluarga") || (roleFilter === "Tenaga Medis" && user.role === "tenaga_medis") || (roleFilter === "Admin" && user.role === "admin");
    const q = search.trim().toLowerCase();
    return matchesRole && (!q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q));
  }), [users, roleFilter, search]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setSuccess("");
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) return setError("Nama, email, dan password minimal 8 karakter wajib diisi.");
    try {
      await createUser(form);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setForm(emptyForm); setIsFormOpen(false); setSuccess("Pengguna berhasil dibuat.");
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal membuat pengguna."); }
  };

  const toggleStatus = async (id: string, status: string | undefined) => {
    try { await updateUser(id, { status: status === "Aktif" ? "Nonaktif" : "Aktif" }); await queryClient.invalidateQueries({ queryKey: ["users"] }); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal mengubah status pengguna."); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Hapus pengguna ini dari sistem?")) return;
    try { await deleteUser(id); await queryClient.invalidateQueries({ queryKey: ["users"] }); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal menghapus pengguna."); }
  };

  return <div className="min-h-screen bg-paper"><TopNav /><main className="min-w-0"><div className="p-4 sm:p-6 lg:p-8">
    <ManagementHeader title="Manajemen Pengguna" description="Kelola akun Keluarga/Caregiver, Tenaga Medis, dan Admin." isFormOpen={isFormOpen} onToggleForm={() => { setError(""); setSuccess(""); setIsFormOpen((open) => !open); }} openLabel="+ Tambah Pengguna" />
    {success && <div className="mb-5 rounded-lg border-l-4 border-safe bg-safe/8 p-4 text-sm text-safe" role="status">{success}</div>}
    {error && <div className="mb-5 rounded-lg border border-danger/25 bg-danger/6 px-4 py-3 text-sm text-danger" role="alert">{error}</div>}
    {isFormOpen && <Card className="mb-6 p-5 sm:p-6"><h2 className="mb-4 font-serif text-base text-ink">Tambah Pengguna Baru</h2><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><TextField id="name" name="name" label="Nama Lengkap" value={form.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((v)=>({...v,name:e.target.value}))} /><TextField id="email" name="email" label="Email" type="email" value={form.email} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((v)=>({...v,email:e.target.value}))} /><TextField id="password" name="password" label="Password Awal" type="password" value={form.password} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((v)=>({...v,password:e.target.value}))} /></div><div className="max-w-md"><p className="mb-2 text-sm font-semibold text-ink-soft">Role</p><div className="flex gap-1.5 rounded-lg bg-paper p-1">{(Object.keys(roleDisplay) as UserRole[]).map((role)=><button key={role} type="button" onClick={()=>setForm((v)=>({...v,role}))} className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold ${form.role===role?"bg-surface text-ink shadow-[var(--shadow-card)]":"text-muted hover:text-ink-soft"}`}>{roleDisplay[role]}</button>)}</div></div><div className="flex justify-end"><Button type="submit" variant="accent" size="sm">Simpan Pengguna</Button></div></form></Card>}
    <Card className="p-6"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><input type="search" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Cari nama atau email..." className="w-full max-w-xs rounded-xl border border-border bg-paper px-4 py-2.5 text-sm text-ink-soft outline-none" /><Select value={roleFilter} onValueChange={setRoleFilter} options={["Semua","Keluarga","Tenaga Medis","Admin"] as const} label="Role" /></div>{usersQuery.isPending?<p className="text-sm text-muted">Memuat pengguna...</p>:filteredUsers.length?<ol className="divide-y divide-border">{filteredUsers.map((user)=><li key={user.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/12 font-serif text-sm text-accent-dark">{getInitials(user.name)}</div><div><p className="text-sm font-semibold text-ink-soft">{user.name}</p><p className="mt-0.5 text-xs text-muted">{roleDisplay[user.role]} · {user.email}</p></div></div><div className="flex items-center gap-2"><Badge variant={user.status==="Aktif"?"success":"neutral"}>{user.status??"Aktif"}</Badge><Button variant="secondary" size="sm" onClick={()=>toggleStatus(user.id,user.status)}>{user.status==="Aktif"?"Nonaktifkan":"Aktifkan"}</Button><Button variant="secondary" size="sm" onClick={()=>remove(user.id)} className="!text-danger">Hapus</Button></div></li>)}</ol>:<EmptyStateMessage message="Belum ada pengguna." />}</Card>
  </div><Footer /></main></div>;
}
export default UserManagement;
