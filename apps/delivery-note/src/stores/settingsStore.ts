import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OcrProvider = "google" | "tesseract";

interface SettingsState {
  ocrProvider: OcrProvider;
  setOcrProvider: (provider: OcrProvider) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ocrProvider: "tesseract", // 기본값은 tesseract (API 키 불필요)
      setOcrProvider: (provider) => set({ ocrProvider: provider }),
    }),
    {
      name: "delivery-note-settings",
    }
  )
);
