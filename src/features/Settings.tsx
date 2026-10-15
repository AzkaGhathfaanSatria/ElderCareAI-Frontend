"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import AccountPageShell from "../components/layout/AccountPageShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { SelectField } from "../components/ui/SelectField";
import { getNotificationPreferences, updateNotificationPreferences } from "../services/backendApi";

interface ToggleRowProps { title: string; description: string; checked: boolean; onChange: (value: boolean) => void; }
function ToggleRow({ title, description, checked, onChange }: ToggleRowProps) { return <div className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><h3 className="text-sm font-semibold text-ink-soft">{title}</h3><p className="mt-1 text-xs text-muted">{description}</p></div><button type="button" role="switch" aria-checked={checked} onClick={()=>onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked?"bg-accent":"bg-ink/15"}`}><span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked?"translate-x-5":"translate-x-0"}`} /></button></div>; }

function Settings() {
  const queryClient = useQueryClient();
  const preferencesQuery = useQuery({ queryKey: ["notification-preferences"], queryFn: getNotificationPreferences });
  const [emailAlert, setEmailAlert] = useState(true);
  const [pushAlert, setPushAlert] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [highAlertOnly, setHighAlertOnly] = useState(false);
  const [soundAlert, setSoundAlert] = useState(true);
  const [language, setLanguage] = useState("id");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => { const p=preferencesQuery.data; if(!p) return; const channels=Array.isArray(p.channels)?p.channels.map(String):[]; setEmailAlert(Boolean(p.email ?? channels.includes("email"))); setPushAlert(Boolean(p.push ?? channels.includes("push"))); setWeeklySummary(Boolean(p.weeklySummary ?? p.weekly_summary)); setHighAlertOnly(String(p.minimumLevel ?? p.level_minimum ?? "").toLowerCase()==="tinggi"); }, [preferencesQuery.data]);

  const handleSave = async () => {
    try {
      await updateNotificationPreferences({ channels: [emailAlert?"email":null, pushAlert?"push":null].filter(Boolean), email: emailAlert, push: pushAlert, weeklySummary, weekly_summary: weeklySummary, minimumLevel: highAlertOnly?"Tinggi":"Rendah", level_minimum: highAlertOnly?"Tinggi":"Rendah" });
      await queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      setSavedMessage("Preferensi notifikasi berhasil disimpan.");
    } catch(e) { setSavedMessage(e instanceof Error ? e.message : "Gagal menyimpan preferensi."); }
  };

  return <AccountPageShell title="Pengaturan" message={savedMessage}>
    <Card className="mb-6 p-6"><header className="mb-2"><h2 className="font-serif text-lg text-ink">Preferensi Notifikasi</h2><p className="mt-1 text-sm text-muted">Atur cara kamu menerima peringatan. Saat ini peringatan tampil di dashboard dan halaman Notifikasi; pengiriman email dan push belum aktif.</p></header><div className="divide-y divide-border"><ToggleRow title="Notifikasi Email" description="Kirim peringatan melalui email." checked={emailAlert} onChange={setEmailAlert}/><ToggleRow title="Notifikasi Push" description="Kirim notifikasi push ke perangkatmu." checked={pushAlert} onChange={setPushAlert}/><ToggleRow title="Ringkasan Mingguan" description="Terima ringkasan kondisi lansia secara berkala." checked={weeklySummary} onChange={setWeeklySummary}/></div></Card>
    <Card className="mb-6 p-6"><header className="mb-2"><h2 className="font-serif text-lg text-ink">Preferensi Peringatan</h2><p className="mt-1 text-sm text-muted">Pilih seberapa serius peringatan yang ingin kamu terima.</p></header><div className="divide-y divide-border"><ToggleRow title="Hanya Peringatan Tingkat Tinggi" description="Minimum level notifikasi menjadi Tinggi." checked={highAlertOnly} onChange={setHighAlertOnly}/><ToggleRow title="Suara Peringatan" description="Tersimpan di browser ini saja." checked={soundAlert} onChange={setSoundAlert}/></div></Card>
    <Card className="mb-6 p-6"><header className="mb-4"><h2 className="font-serif text-lg text-ink">Umum</h2><p className="mt-1 text-sm text-muted">Bahasa tetap menjadi pengaturan frontend.</p></header><SelectField id="language" label="Bahasa" value={language} onChange={(e)=>setLanguage(e.target.value)} wrapperClassName="sm:w-64"><option value="id">Bahasa Indonesia</option><option value="en">English</option></SelectField></Card>
    <Button variant="accent" size="md" onClick={handleSave}>Simpan Preferensi</Button>
  </AccountPageShell>;
}
export default Settings;
