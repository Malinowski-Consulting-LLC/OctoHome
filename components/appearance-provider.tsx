"use client";

import type { ReactNode } from "react";
import { useLayoutEffect } from "react";
import {
  getRootAppearanceAttributes,
  getSystemColorSchemeFromPreference,
} from "@/lib/appearance";
import { useAppearanceStore } from "@/store/use-appearance-store";

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const selectedTheme = useAppearanceStore((state) => state.selectedTheme);
  const magicEnabled = useAppearanceStore((state) => state.magicEnabled);

  useLayoutEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const attrs = getRootAppearanceAttributes({
        selectedTheme,
        systemScheme: getSystemColorSchemeFromPreference(mediaQuery.matches),
        magicEnabled,
      });

      for (const [name, value] of Object.entries(attrs)) {
        document.documentElement.setAttribute(name, value);
      }
    };

    apply();

    if (selectedTheme !== "aether") {
      return;
    }

    const handler = () => apply();
    mediaQuery.addEventListener("change", handler);

    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [magicEnabled, selectedTheme]);

  return children;
}
