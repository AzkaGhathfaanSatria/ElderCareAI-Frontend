"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import {
  buildPairingLink,
  isLocalOnlyUrl,
  isValidServerUrl,
  loadServerUrl,
  normalizeServerUrl,
  saveServerUrl,
} from "../../lib/pairing";
import TextField from "../ui/TextField";

interface PairingQrProps {
  deviceKey: string;
}

/** QR pairing untuk wearable: scan dari aplikasi mobile ElderCare AI, tanpa menyalin key manual. */
function PairingQr({ deviceKey }: PairingQrProps) {
  // Komponen ini hanya tampil setelah pengguna mendaftarkan perangkat (tidak ikut render server),
  // jadi aman membaca localStorage saat state pertama dibuat.
  const [serverUrl, setServerUrl] = useState(loadServerUrl);

  const normalized = normalizeServerUrl(serverUrl);
  const valid = isValidServerUrl(normalized);
  const localOnly = valid && isLocalOnlyUrl(normalized);
  const link = valid ? buildPairingLink(normalized, deviceKey) : "";

  const handleChange = (value: string) => {
    setServerUrl(value);
    const next = normalizeServerUrl(value);
    if (isValidServerUrl(next)) saveServerUrl(next);
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-paper p-4">
      <p className="text-sm font-semibold text-ink">Hubungkan jam lewat HP</p>
      <div className="mt-3 max-w-md">
        <TextField
          id={`server-url-${deviceKey.slice(0, 8)}`}
          label="Alamat server (yang dipakai HP)"
          value={serverUrl}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="http://192.168.1.10:4000"
          autoComplete="off"
        />
        <p className="mt-1 text-xs text-muted">
          Isi IP laptop yang menjalankan backend, di Wi-Fi yang sama dengan HP. Cek dengan perintah{" "}
          <code>ipconfig</code> (Windows). Cukup diisi sekali, alamat diingat di browser ini.
        </p>
      </div>
      {localOnly && (
        <p className="mt-3 rounded-md border border-warn/40 bg-warn/8 px-3 py-2 text-xs text-ink">
          <code>localhost</code> hanya bisa dipakai di laptop ini, HP tidak akan bisa menyambung.
          Ganti dengan IP laptop, misalnya <code>http://192.168.1.10:4000</code>.
        </p>
      )}
      {!valid && serverUrl.trim() !== "" && (
        <p className="mt-3 text-xs text-danger">Alamat server belum valid.</p>
      )}
      {valid && (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="w-fit shrink-0 rounded-lg bg-white p-3">
            <QRCodeSVG value={link} size={168} level="M" title="QR pairing wearable" />
          </div>
          <div className="min-w-0 text-sm text-ink-soft">
            <ol className="list-decimal space-y-1 pl-5">
              <li>Buka aplikasi ElderCare AI di HP yang terhubung ke jam, lalu login.</li>
              <li>Ketuk ikon akun → "Hubungkan jam" → "Scan QR", lalu arahkan ke kode ini.</li>
              <li>Selesai. Data mengalir otomatis ke dashboard.</li>
            </ol>
            <p className="mt-3 text-xs text-muted">
              Membuka halaman ini langsung di HP yang sama?{" "}
              <a href={link} className="font-semibold underline">
                Buka di aplikasi
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PairingQr;
