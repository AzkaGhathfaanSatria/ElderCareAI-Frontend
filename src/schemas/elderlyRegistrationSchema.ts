import { z } from "zod";

export const ElderlyRegistrationSchema = z.object({
  name: z.string().trim().min(1, "Nama lansia wajib diisi."),

  birthDate: z.string().min(1, "Tanggal lahir wajib diisi."),

  address: z.string().trim().min(1, "Alamat wajib diisi."),

  healthNotes: z.string().trim().min(1, "Catatan kesehatan wajib diisi."),

  wearableType: z.string().min(1, "Tipe wearable wajib dipilih."),

  wearableId: z.string().trim().min(1, "ID perangkat wearable wajib diisi."),

  cameraType: z.string().min(1, "Tipe kamera wajib dipilih."),

  cameraId: z.string().trim().min(1, "ID kamera wajib diisi."),

  // Koneksi stream RTSP (opsional). Jika cameraHost diisi, stream langsung disambungkan setelah disimpan.
  rtsp: z.string().default(""),
  cameraHost: z.string().trim().default(""),
  cameraPort: z.string().default(""),
  cameraUser: z.string().default(""),
  cameraPassword: z.string().default(""),
  cameraPath: z.string().trim().default(""),
  cameraFps: z.string().default("1"),
});

export type ElderlyRegistrationInput = z.infer<typeof ElderlyRegistrationSchema>;
