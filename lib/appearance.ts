export type AppearanceTheme = "aether" | "high-contrast";
export type ColorScheme = "light" | "dark";
export type EffectsMode = "full" | "reduced";
export type AppearanceRootAttributes = {
  "data-theme": AppearanceTheme;
  "data-color-scheme": ColorScheme;
  "data-effects": EffectsMode;
};

export type ResolvedAppearanceState = {
  theme: AppearanceTheme;
  colorScheme: ColorScheme;
  effectsMode: EffectsMode;
};

export const APPEARANCE_STORAGE_KEY = "octohome-appearance";
export const LEGACY_ONBOARDING_STORAGE_KEY = "octohome-onboarding";

export function normalizeSystemColorScheme(value: string | null | undefined): ColorScheme {
  return value === "dark" ? "dark" : "light";
}

export function getSystemColorSchemeFromPreference(matches: boolean): ColorScheme {
  return matches ? "dark" : "light";
}

export function normalizeStoredTheme(value: string | null | undefined): AppearanceTheme {
  return value === "high-contrast" ? "high-contrast" : "aether";
}

export function getLegacyMagicModePreference(rawStorage?: string | null): boolean {
  if (!rawStorage) return true;
  try {
    const parsed = JSON.parse(rawStorage) as { state?: { magicEnabled?: unknown } };
    return typeof parsed.state?.magicEnabled === "boolean" ? parsed.state.magicEnabled : true;
  } catch {
    return true;
  }
}

export function resolveAppearanceState(input: {
  selectedTheme?: string | null;
  systemScheme?: string | null;
  magicEnabled?: boolean;
} = {}): ResolvedAppearanceState {
  const theme = normalizeStoredTheme(input.selectedTheme);
  const colorScheme = theme === "aether" ? normalizeSystemColorScheme(input.systemScheme) : "light";
  const effectsMode: EffectsMode = input.magicEnabled === false ? "reduced" : "full";

  return { theme, colorScheme, effectsMode };
}

export function getRootAppearanceAttributes(input: {
  selectedTheme?: string | null;
  systemScheme?: string | null;
  magicEnabled?: boolean;
} = {}): AppearanceRootAttributes {
  const { theme, colorScheme, effectsMode } = resolveAppearanceState(input);

  return {
    "data-theme": theme,
    "data-color-scheme": colorScheme,
    "data-effects": effectsMode,
  };
}

export function getAppearanceBootstrapScript(): string {
  return `(() => {
  const root = document.documentElement;
  root.setAttribute("data-theme", "aether");
  root.setAttribute("data-color-scheme", "light");
  root.setAttribute("data-effects", "full");

  try {
    const stored = localStorage.getItem("${APPEARANCE_STORAGE_KEY}");
    const parsed = stored ? JSON.parse(stored) : undefined;
    const onboarding = localStorage.getItem("${LEGACY_ONBOARDING_STORAGE_KEY}");
    const magicEnabled = typeof parsed?.state?.magicEnabled === "boolean"
      ? parsed.state.magicEnabled
      : (() => {
          try {
            const legacy = onboarding ? JSON.parse(onboarding) : undefined;
            return typeof legacy?.state?.magicEnabled === "boolean" ? legacy.state.magicEnabled : true;
          } catch {
            return true;
          }
        })();
    const theme = parsed?.state?.selectedTheme === "high-contrast" ? "high-contrast" : "aether";
    const prefersDark = typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const colorScheme = theme === "aether" ? (prefersDark ? "dark" : "light") : "light";
    const effectsMode = magicEnabled === false ? "reduced" : "full";

    root.setAttribute("data-theme", theme);
    root.setAttribute("data-color-scheme", colorScheme);
    root.setAttribute("data-effects", effectsMode);
  } catch {
  }
})();`;
}
