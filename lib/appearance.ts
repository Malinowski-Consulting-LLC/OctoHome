export type AppearanceTheme = "aether" | "high-contrast";
export type ColorScheme = "light" | "dark";
export type EffectsMode = "full" | "reduced";

export type ResolvedAppearanceState = {
  theme: AppearanceTheme;
  colorScheme: ColorScheme;
  effectsMode: EffectsMode;
};

export function normalizeSystemColorScheme(value: string | null | undefined): ColorScheme {
  return value === "dark" ? "dark" : "light";
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

export function getAppearanceBootstrapScript(): string {
  return `(() => {
  const root = document.documentElement;
  root.setAttribute("data-theme", "aether");
  root.setAttribute("data-color-scheme", "light");
  root.setAttribute("data-effects", "full");

  try {
    const storedTheme = localStorage.getItem("octohome-appearance-theme");
    const onboarding = localStorage.getItem("octohome-onboarding");
    const parsed = onboarding ? JSON.parse(onboarding) : undefined;
    const magicEnabled = typeof parsed?.state?.magicEnabled === "boolean" ? parsed.state.magicEnabled : true;
    const theme = storedTheme === "high-contrast" ? "high-contrast" : "aether";
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
