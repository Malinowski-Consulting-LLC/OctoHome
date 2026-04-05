"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { getRootAppearanceAttributes, normalizeSystemColorScheme } from "@/lib/appearance";
import { useAppearanceStore } from "@/store/use-appearance-store";

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const selectedTheme = useAppearanceStore((state) => state.selectedTheme);
  const magicEnabled = useAppearanceStore((state) => state.magicEnabled);

  useEffect(() => {
    const systemScheme =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    const attrs = getRootAppearanceAttributes({
      selectedTheme,
      systemScheme: normalizeSystemColorScheme(systemScheme),
      magicEnabled,
    });

    for (const [name, value] of Object.entries(attrs)) {
      document.documentElement.setAttribute(name, value);
    }
  }, [magicEnabled, selectedTheme]);

  return children;
}
