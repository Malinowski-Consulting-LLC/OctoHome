"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  APPEARANCE_STORAGE_KEY,
  getLegacyMagicModePreference,
  type AppearanceTheme,
  LEGACY_ONBOARDING_STORAGE_KEY,
} from "@/lib/appearance";

type AppearanceState = {
  selectedTheme: AppearanceTheme;
  magicEnabled: boolean;
  setSelectedTheme: (theme: AppearanceTheme) => void;
  toggleMagicMode: () => void;
};

const getInitialMagicEnabled = () => {
  if (typeof window === "undefined") return true;

  try {
    // Legacy onboarding only seeds the first load; persisted appearance wins once present.
    return getLegacyMagicModePreference(localStorage.getItem(LEGACY_ONBOARDING_STORAGE_KEY));
  } catch {
    return true;
  }
};

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      selectedTheme: "aether",
      magicEnabled: getInitialMagicEnabled(),
      setSelectedTheme: (theme) => set({ selectedTheme: theme }),
      toggleMagicMode: () => set((state) => ({ magicEnabled: !state.magicEnabled })),
    }),
    {
      name: APPEARANCE_STORAGE_KEY,
      partialize: (state) => ({
        selectedTheme: state.selectedTheme,
        magicEnabled: state.magicEnabled,
      }),
    }
  )
);
