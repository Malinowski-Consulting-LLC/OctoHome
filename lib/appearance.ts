export type AppearanceTheme = "aether" | "light" | "dark" | "high-contrast";
export type ColorScheme = "light" | "dark";
export type EffectsMode = "magic" | "reduced";

export type ResolvedAppearanceState = {
  theme: AppearanceTheme;
  colorScheme: ColorScheme;
  effectsMode: EffectsMode;
};

const APPEARANCE_THEMES: readonly AppearanceTheme[] = ["aether", "light", "dark", "high-contrast"];

export function normalizeSystemColorScheme(value: string | null | undefined): ColorScheme {
  return value === "dark" ? "dark" : "light";
}

export function normalizeStoredTheme(value: string | null | undefined): AppearanceTheme {
  return APPEARANCE_THEMES.includes(value as AppearanceTheme) ? (value as AppearanceTheme) : "aether";
}

export function getLegacyMagicModePreference(
  storage?: Pick<Storage, "getItem"> | null
): boolean {
  if (!storage) return true;

  try {
    const raw = storage.getItem("octohome-onboarding");
    if (!raw) return true;

    const parsed = JSON.parse(raw) as { magicEnabled?: unknown };
    return typeof parsed.magicEnabled === "boolean" ? parsed.magicEnabled : true;
  } catch {
    return true;
  }
}

export function resolveAppearanceState(input: {
  storedTheme?: string | null;
  magicEnabled?: boolean;
  systemColorScheme?: string | null;
} = {}): ResolvedAppearanceState {
  const theme = normalizeStoredTheme(input.storedTheme);
  const colorScheme =
    theme === "aether"
      ? normalizeSystemColorScheme(input.systemColorScheme)
      : theme === "dark"
        ? "dark"
        : "light";
  const effectsMode: EffectsMode = input.magicEnabled === false || theme === "high-contrast" ? "reduced" : "magic";

  return { theme, colorScheme, effectsMode };
}

export function getAppearanceBootstrapScript(): string {
  return `(() => {
  const root = document.documentElement;
  root.setAttribute("data-theme", "aether");
  root.setAttribute("data-color-scheme", "light");
  root.setAttribute("data-effects-mode", "reduced");

  try {
    const storedTheme = localStorage.getItem("octohome-appearance-theme");
    const onboarding = localStorage.getItem("octohome-onboarding");
    const parsed = onboarding ? JSON.parse(onboarding) : undefined;
    const magicEnabled = typeof parsed?.magicEnabled === "boolean" ? parsed.magicEnabled : true;
    const theme = storedTheme === "aether" || storedTheme === "light" || storedTheme === "dark" || storedTheme === "high-contrast"
      ? storedTheme
      : "aether";
    const prefersDark = typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const colorScheme =
      theme === "aether" ? (prefersDark ? "dark" : "light") : theme === "dark" ? "dark" : "light";
    const effectsMode = !magicEnabled || theme === "high-contrast" ? "reduced" : "magic";

    root.setAttribute("data-theme", theme);
    root.setAttribute("data-color-scheme", colorScheme);
    root.setAttribute("data-effects-mode", effectsMode);
  } catch {
  }
})();`;
}
