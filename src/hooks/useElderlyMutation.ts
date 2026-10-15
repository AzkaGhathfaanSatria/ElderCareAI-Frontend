"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ElderlyRegistrationInput } from "../schemas/elderlyRegistrationSchema";
import { createCamera, createElder, createWearable, pairDevice } from "../services/backendApi";

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

      if (input.wearableId) {
        const wearable = await createWearable({ deviceId: input.wearableId, id_wearable: input.wearableId, type: input.wearableType, tipe: input.wearableType, elderId, id_lansia: elderId });
        const wearableId = wearable.id || input.wearableId;
        await pairDevice(wearableId, elderId);
        if (wearable.deviceKey) deviceKeys.push({ label: `Wearable ${input.wearableId}`, key: wearable.deviceKey });
      }

      if (input.cameraId) {
        const camera = await createCamera({ deviceId: input.cameraId, id_kamera: input.cameraId, type: input.cameraType, tipe: input.cameraType, elderId, id_lansia: elderId });
        const cameraId = camera.id || input.cameraId;
        await pairDevice(cameraId, elderId);
        if (camera.deviceKey) deviceKeys.push({ label: `Kamera ${input.cameraId}`, key: camera.deviceKey });
      }
      return { elder, deviceKeys };
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
