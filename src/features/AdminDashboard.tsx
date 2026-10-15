"use client";

import { useQuery } from "@tanstack/react-query";
import Footer from "../components/layout/Footer";
import TopNav from "../components/layout/TopNav";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import { getBackendHealth, getDevices, getElders, getUsers } from "../services/backendApi";

type ServiceBadge = { variant: "success" | "warning" | "neutral"; label: string };

/** Status layanan dari /health: ok = normal, nonaktif = sengaja dimatikan, selain itu gagal. */
function svc(value: unknown): ServiceBadge {
  if (value === "ok") return { variant: "success", label: "Normal" };
  if (value === "nonaktif") return { variant: "neutral", label: "Nonaktif" };
  if (value === undefined) return { variant: "neutral", label: "…" };
  return { variant: "warning", label: "Gagal" };
}

function AdminDashboard() {
  const users=useQuery({queryKey:["users"],queryFn:getUsers});
  const elders=useQuery({queryKey:["elders"],queryFn:getElders});
  const devices=useQuery({queryKey:["devices"],queryFn:getDevices});
  const health=useQuery({queryKey:["backend-health"],queryFn:getBackendHealth,refetchInterval:30000});
  const userItems=users.data??[]; const elderItems=elders.data??[]; const deviceItems=devices.data??[];
  const activeDevices=deviceItems.filter(d=>["terhubung","connected","aktif","online"].includes((d.status??"").toLowerCase())).length;
  return <div className="min-h-screen bg-paper"><TopNav/><main className="min-w-0"><div className="p-4 sm:p-6 lg:p-8"><header className="mb-6"><h1 className="font-serif text-2xl text-ink sm:text-3xl">Dashboard Admin</h1><p className="mt-2 text-sm leading-6 text-muted">Ringkasan kondisi pengguna, lansia, perangkat, dan layanan sistem.</p></header><Card className="mb-6 grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4"><div className="p-5"><p className="text-sm text-muted">Total Pengguna</p><span className="font-serif text-3xl text-ink">{users.isPending?"…":userItems.length}</span><p className="mt-2 text-xs text-muted">{userItems.filter(u=>u.role==="keluarga").length} Keluarga · {userItems.filter(u=>u.role==="tenaga_medis").length} Medis · {userItems.filter(u=>u.role==="admin").length} Admin</p></div><div className="p-5"><p className="text-sm text-muted">Lansia Terpantau</p><span className="font-serif text-3xl text-ink">{elders.isPending?"…":elderItems.length}</span><Badge variant="success" className="mt-3">Terdaftar</Badge></div><div className="p-5"><p className="text-sm text-muted">Perangkat Terhubung</p><span className="font-serif text-3xl text-ink">{devices.isPending?"…":activeDevices}</span><span className="text-xs text-muted"> / {deviceItems.length}</span><Badge variant={activeDevices===deviceItems.length?"success":"warning"} className="mt-3">Status perangkat</Badge></div><div className="p-5"><p className="text-sm text-muted">Server Aplikasi</p><span className="font-serif text-3xl text-ink">{health.isPending?"…":health.isError?"Down":"Aktif"}</span><Badge variant={health.isError?"warning":"success"} className="mt-3">{health.isError?"Perlu Diperiksa":"Berjalan normal"}</Badge></div></Card><section className="grid grid-cols-1 gap-6 xl:grid-cols-2"><Card className="p-6"><header className="mb-4"><h2 className="font-serif text-lg text-ink">Status Layanan</h2><p className="mt-1 text-sm text-muted">Pemeriksaan otomatis tiap 30 detik.</p></header><div className="divide-y divide-border"><div className="flex items-center justify-between py-3.5"><div><p className="text-sm font-semibold text-ink-soft">Server Aplikasi</p><p className="text-xs text-muted">Menjawab pemeriksaan kesehatan</p></div><Badge variant={health.isError?"warning":"success"}>{health.isError?"Gagal":"Normal"}</Badge></div><div className="flex items-center justify-between py-3.5"><div><p className="text-sm font-semibold text-ink-soft">PostgreSQL</p><p className="text-xs text-muted">Basis data utama</p></div><Badge variant={svc((health.data as Record<string, unknown> | undefined)?.database).variant}>{svc((health.data as Record<string, unknown> | undefined)?.database).label}</Badge></div><div className="flex items-center justify-between py-3.5"><div><p className="text-sm font-semibold text-ink-soft">AI Service</p><p className="text-xs text-muted">Deteksi jatuh dan anomali (hanya diakses server)</p></div><Badge variant={svc((health.data as Record<string, unknown> | undefined)?.ai).variant}>{svc((health.data as Record<string, unknown> | undefined)?.ai).label}</Badge></div></div></Card><Card className="p-6"><header className="mb-4"><h2 className="font-serif text-lg text-ink">Ringkasan Data</h2><p className="mt-1 text-sm text-muted">Jumlah data yang tercatat di sistem.</p></header><div className="space-y-3 text-sm text-ink-soft"><p>Pengguna aktif: {userItems.filter(u=>(u.status??"Aktif")==="Aktif").length}</p><p>Lansia: {elderItems.length}</p><p>Perangkat: {deviceItems.length}</p><p>Perangkat terhubung: {activeDevices}</p></div></Card></section></div><Footer/></main></div>;
}
export default AdminDashboard;
