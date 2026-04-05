"use client";

import { Sparkles } from "lucide-react";

import { SurfaceCard } from "@/components/surface-card";
import { type AppearanceTheme } from "@/lib/appearance";
import { cn } from "@/lib/utils";
import { useAppearanceStore } from "@/store/use-appearance-store";

const THEME_OPTIONS: Array<{
  value: AppearanceTheme;
  label: string;
  eyebrow: string;
  description: string;
}> = [
  {
    value: "aether",
    label: "Aether Canopy",
    eyebrow: "Default",
    description: "Follows your system light or dark setting with OctoHome’s calmer everyday palette.",
  },
  {
    value: "high-contrast",
    label: "High Contrast",
    eyebrow: "Accessibility",
    description: "Uses stronger separation, clearer edges, and a higher-clarity presentation for readability.",
  },
];

function ThemePreview(props: { theme: AppearanceTheme }) {
  if (props.theme === "aether") {
    return (
      <div aria-hidden="true" className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="overflow-hidden rounded-[calc(var(--radius-control)-4px)] border border-[rgba(191,208,241,0.72)] bg-white shadow-[0_12px_24px_rgba(118,156,255,0.12)]">
          <div className="flex items-center justify-between border-b border-[rgba(191,208,241,0.72)] bg-[rgba(244,247,255,0.82)] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[rgba(88,109,171,0.92)]">
            <span>Light</span>
            <span className="h-2 w-2 rounded-full bg-[rgba(118,156,255,0.9)]" />
          </div>
          <div className="space-y-2 p-3">
            <div className="h-2 w-16 rounded-full bg-[rgba(88,109,171,0.18)]" />
            <div className="rounded-[12px] border border-[rgba(191,208,241,0.6)] bg-[rgba(255,255,255,0.92)] p-2">
              <div className="h-2 w-3/4 rounded-full bg-[rgba(118,156,255,0.26)]" />
              <div className="mt-2 h-1.5 w-1/2 rounded-full bg-[rgba(95,231,207,0.3)]" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[calc(var(--radius-control)-4px)] border border-[rgba(112,132,194,0.35)] bg-[rgba(17,25,48,0.94)] shadow-[0_12px_24px_rgba(9,14,29,0.24)]">
          <div className="flex items-center justify-between border-b border-[rgba(112,132,194,0.35)] bg-[rgba(24,34,64,0.82)] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[rgba(210,221,255,0.88)]">
            <span>Dark</span>
            <span className="h-2 w-2 rounded-full bg-[rgba(146,136,255,0.92)]" />
          </div>
          <div className="space-y-2 p-3">
            <div className="h-2 w-16 rounded-full bg-[rgba(210,221,255,0.2)]" />
            <div className="rounded-[12px] border border-[rgba(112,132,194,0.28)] bg-[rgba(24,34,64,0.82)] p-2">
              <div className="h-2 w-3/4 rounded-full bg-[rgba(146,136,255,0.32)]" />
              <div className="mt-2 h-1.5 w-1/2 rounded-full bg-[rgba(63,200,255,0.3)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="mt-4 overflow-hidden rounded-[calc(var(--radius-control)-4px)] border-2 border-black bg-white">
      <div className="flex items-center justify-between border-b-2 border-black bg-[#f2f2f2] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black">
        <span>High Contrast</span>
        <span className="rounded-full border border-black bg-white px-2 py-0.5 text-[10px] leading-none">Readable</span>
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-2">
          <div className="h-2 w-3/4 bg-black" />
          <div className="rounded-[10px] border-2 border-black bg-[#f2f2f2] p-2">
            <div className="h-2 w-2/3 bg-black" />
            <div className="mt-2 h-2 w-1/2 bg-[#4d4d4d]" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:w-24 sm:flex-col">
          <span className="rounded-md border-2 border-black bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
            Focus
          </span>
          <span className="rounded-md border-2 border-black bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black">
            Clarity
          </span>
        </div>
      </div>
    </div>
  );
}

export function AppearanceSettingsCard() {
  const selectedTheme = useAppearanceStore((state) => state.selectedTheme);
  const setSelectedTheme = useAppearanceStore((state) => state.setSelectedTheme);
  const magicEnabled = useAppearanceStore((state) => state.magicEnabled);
  const toggleMagicMode = useAppearanceStore((state) => state.toggleMagicMode);

  return (
    <SurfaceCard aria-labelledby="appearance-settings-heading" className="space-y-6">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Appearance
        </div>
        <h2 id="appearance-settings-heading" className="mt-3 text-xl font-semibold text-foreground sm:text-2xl">
          Choose the feel of your household workspace
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          Aether Canopy is the default and automatically follows your device light or dark preference. Switch to High
          Contrast when you want stronger visual separation and maximum clarity.
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">Appearance theme</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {THEME_OPTIONS.map((option) => {
            const isSelected = selectedTheme === option.value;

            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer flex-col rounded-[var(--radius-control)] border bg-[color:var(--interactive-bg)] p-4 text-left transition-colors hover:bg-[color:var(--interactive-hover)] focus-within:ring-2 focus-within:ring-[color:var(--ring-color)]",
                  isSelected
                    ? "border-[color:var(--ring-color)] bg-[color:var(--interactive-hover)] bg-[image:var(--accent-gradient)] shadow-[var(--shadow-card)]"
                    : "border-[color:var(--border-subtle)]"
                )}
              >
                <input
                  type="radio"
                  name="appearance-theme"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => setSelectedTheme(option.value)}
                  className="sr-only"
                />

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {option.eyebrow}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-foreground">{option.label}</h3>
                  </div>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isSelected
                        ? "border-[color:var(--ring-color)] bg-[color:var(--foreground)]"
                        : "border-[color:var(--border-subtle)] bg-[color:var(--surface-1)]"
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        isSelected ? "bg-[color:var(--background)]" : "bg-transparent"
                      )}
                    />
                  </span>
                </div>

                <ThemePreview theme={option.value} />

                <p className="mt-3 text-sm leading-6 text-muted-foreground">{option.description}</p>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h3 className="text-base font-semibold text-foreground sm:text-lg">Magic Mode</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Keeps motion and visual depth enabled across the app. Theme selection and Magic Mode stay separate, so
              you can pair either theme with either motion setting.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <span className="text-sm font-medium text-muted-foreground">{magicEnabled ? "On" : "Off"}</span>
            <button
              type="button"
              role="switch"
              aria-checked={magicEnabled}
              aria-label="Toggle Magic Mode"
              onClick={toggleMagicMode}
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-color)]",
                magicEnabled
                  ? "border-[color:var(--foreground)] bg-[color:var(--foreground)]"
                  : "border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)]"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-block h-5 w-5 rounded-full bg-[color:var(--background)] transition-transform",
                  magicEnabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
