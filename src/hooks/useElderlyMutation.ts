"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ElderlyRegistrationInput } from "../schemas/elderlyRegistrationSchema";
import {
  createCamera,
  createElder,
  createWearable,
  pairDevice,
  saveCameraStream,
  startCameraStream,
} from "../services/backendApi";

export function useElderlyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ElderlyRegistrationInput) => {
      const elder = await createElder({
        name: input.name,
        nama: input.name,
        birthDate: input.birthDate,
        tanggal_lahir: input.birthDate,
        address: input.address,
        alamat: input.address,
        healthNotes: input.healthNotes,
        catatan_kesehatan: input.healthNotes,
      });
      const elderId = elder.id;
      if (!elderId) throw new Error("Backend tidak mengembalikan ID lansia.");
      // Device key hanya dikirim backend sekali saat perangkat dibuat, jadi harus ditampilkan ke pengguna.
      const deviceKeys: { label: string; key: string }[] = [];
      let streamNote = "";

      if (input.wearableId) {
        const wearable = await createWearable({
          deviceId: input.wearableId,
          id_wearable: input.wearableId,
          type: input.wearableType,
          tipe: input.wearableType,
          elderId,
          id_lansia: elderId,
        });
        const wearableId = wearable.id || input.wearableId;
        await pairDevice(wearableId, elderId);
        if (wearable.deviceKey)
          deviceKeys.push({ label: `Wearable ${input.wearableId}`, key: wearable.deviceKey });
      }

      if (input.cameraId) {
        const camera = await createCamera({
          deviceId: input.cameraId,
          id_kamera: input.cameraId,
          type: input.cameraType,
          tipe: input.cameraType,
          elderId,
          id_lansia: elderId,
        });
        const cameraId = camera.id || input.cameraId;
        await pairDevice(cameraId, elderId);
        if (camera.deviceKey)
          deviceKeys.push({ label: `Kamera ${input.cameraId}`, key: camera.deviceKey });
        // Kalau IP diisi, langsung simpan pengaturan stream dan nyalakan. Gagal di sini tidak membatalkan pendaftaran.
        if (input.cameraHost) {
          try {
            await saveCameraStream(cameraId, {
              host: input.cameraHost,
              port: input.cameraPort ? Number(input.cameraPort) : null,
              username: input.cameraUser,
              password: input.cameraPassword,
              path: input.cameraPath,
              fps: Number(input.cameraFps) || 1,
            });
            await startCameraStream(cameraId);
            streamNote =
              "Stream kamera sedang disambungkan, cek statusnya di halaman Perangkat > Pengaturan stream.";
          } catch (e) {
            streamNote = `Stream kamera belum tersambung (${e instanceof Error ? e.message : "gagal"}). Perbaiki lewat halaman Perangkat > Pengaturan stream.`;
          }
        }
      }
      return { elder, deviceKeys, streamNote };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["elder-care"] }),
        queryClient.invalidateQueries({ queryKey: ["elders"] }),
        queryClient.invalidateQueries({ queryKey: ["devices"] }),
      ]);
    },
  });
}
