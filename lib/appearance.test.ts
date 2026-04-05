import assert from "node:assert/strict";
import test from "node:test";

import {
  getAppearanceBootstrapScript,
  getLegacyMagicModePreference,
  normalizeStoredTheme,
  normalizeSystemColorScheme,
  resolveAppearanceState,
} from "./appearance.ts";

const createStorage = (value?: string) => ({
  getItem: () => value ?? null,
});

test("resolveAppearanceState uses system dark mode for Aether", () => {
  const state = resolveAppearanceState({
    storedTheme: "aether",
    magicEnabled: true,
    systemColorScheme: "dark",
  });

  assert.deepEqual(state, {
    theme: "aether",
    colorScheme: "dark",
    effectsMode: "magic",
  });
});

test("normalizeStoredTheme falls back to aether on invalid values", () => {
  assert.equal(normalizeStoredTheme("sunset"), "aether");
});

test("resolveAppearanceState keeps high contrast explicit and reduces effects when magic is off", () => {
  const state = resolveAppearanceState({
    storedTheme: "high-contrast",
    magicEnabled: false,
    systemColorScheme: "dark",
  });

  assert.deepEqual(state, {
    theme: "high-contrast",
    colorScheme: "light",
    effectsMode: "reduced",
  });
});

test("getLegacyMagicModePreference reads magicEnabled from onboarding storage", () => {
  const storage = createStorage(JSON.stringify({ magicEnabled: false }));

  assert.equal(getLegacyMagicModePreference(storage), false);
});

test("getLegacyMagicModePreference falls back to true when storage is missing", () => {
  assert.equal(getLegacyMagicModePreference(undefined), true);
});

test("getLegacyMagicModePreference falls back to true for malformed JSON", () => {
  const storage = createStorage("{");

  assert.equal(getLegacyMagicModePreference(storage), true);
});

test("getLegacyMagicModePreference falls back to true when magicEnabled is absent", () => {
  const storage = createStorage(JSON.stringify({ step: 2 }));

  assert.equal(getLegacyMagicModePreference(storage), true);
});

test("getAppearanceBootstrapScript includes safe fallback root attributes", () => {
  const script = getAppearanceBootstrapScript();

  assert.match(script, /setAttribute\("data-theme",\s*"aether"\)/);
  assert.match(script, /setAttribute\("data-color-scheme",\s*"light"\)/);
  assert.match(script, /setAttribute\("data-effects-mode",\s*"reduced"\)/);
});

test("normalizeSystemColorScheme falls back to light when unavailable", () => {
  assert.equal(normalizeSystemColorScheme(undefined), "light");
});
