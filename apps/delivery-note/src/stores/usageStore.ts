import { create } from "zustand";
import { persist } from "zustand/middleware";

const MONTHLY_LIMIT = 900; // 1000건 중 안전하게 900건만 사용

interface UsageState {
  // Google Vision API 사용량
  googleVisionCount: number;
  googleVisionMonth: string; // "2025-01" 형식

  // Actions
  incrementGoogleVision: () => boolean; // 성공 시 true, 한도 초과 시 false
  getGoogleVisionRemaining: () => number;
  isGoogleVisionLimitReached: () => boolean;
  resetIfNewMonth: () => void;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      googleVisionCount: 0,
      googleVisionMonth: getCurrentMonth(),

      incrementGoogleVision: () => {
        const state = get();

        // 새 달이면 리셋
        const currentMonth = getCurrentMonth();
        if (state.googleVisionMonth !== currentMonth) {
          set({
            googleVisionCount: 1,
            googleVisionMonth: currentMonth,
          });
          return true;
        }

        // 한도 체크
        if (state.googleVisionCount >= MONTHLY_LIMIT) {
          return false;
        }

        set({ googleVisionCount: state.googleVisionCount + 1 });
        return true;
      },

      getGoogleVisionRemaining: () => {
        const state = get();
        const currentMonth = getCurrentMonth();

        // 새 달이면 전체 한도
        if (state.googleVisionMonth !== currentMonth) {
          return MONTHLY_LIMIT;
        }

        return Math.max(0, MONTHLY_LIMIT - state.googleVisionCount);
      },

      isGoogleVisionLimitReached: () => {
        const state = get();
        const currentMonth = getCurrentMonth();

        // 새 달이면 리셋됨
        if (state.googleVisionMonth !== currentMonth) {
          return false;
        }

        return state.googleVisionCount >= MONTHLY_LIMIT;
      },

      resetIfNewMonth: () => {
        const state = get();
        const currentMonth = getCurrentMonth();

        if (state.googleVisionMonth !== currentMonth) {
          set({
            googleVisionCount: 0,
            googleVisionMonth: currentMonth,
          });
        }
      },
    }),
    {
      name: "delivery-note-usage",
    }
  )
);

export const GOOGLE_VISION_MONTHLY_LIMIT = MONTHLY_LIMIT;
