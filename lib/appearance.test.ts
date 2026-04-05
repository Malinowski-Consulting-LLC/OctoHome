import assert from "node:assert/strict";
import test from "node:test";

import {
  getAppearanceBootstrapScript,
  getRootAppearanceAttributes,
  getLegacyMagicModePreference,
  normalizeStoredTheme,
  normalizeSystemColorScheme,
  resolveAppearanceState,
} from "./appearance.ts";

test("resolveAppearanceState uses system dark mode for Aether", () => {
  const state = resolveAppearanceState({
    selectedTheme: "aether",
    magicEnabled: true,
    systemScheme: "dark",
  });

  assert.deepEqual(state, {
    theme: "aether",
    colorScheme: "dark",
    effectsMode: "full",
  });
});

test("normalizeStoredTheme falls back to aether on invalid values", () => {
  assert.equal(normalizeStoredTheme("sunset"), "aether");
});

test("resolveAppearanceState keeps high contrast explicit and reduces effects when magic is off", () => {
  const state = resolveAppearanceState({
    selectedTheme: "high-contrast",
    magicEnabled: false,
    systemScheme: "dark",
  });

  assert.deepEqual(state, {
    theme: "high-contrast",
    colorScheme: "light",
    effectsMode: "reduced",
  });
});

test("getLegacyMagicModePreference reads magicEnabled from onboarding storage", () => {
  assert.equal(getLegacyMagicModePreference(JSON.stringify({ state: { magicEnabled: false } })), false);
});

test("getLegacyMagicModePreference falls back to true when storage is missing", () => {
  assert.equal(getLegacyMagicModePreference(undefined), true);
});

test("getLegacyMagicModePreference falls back to true for malformed JSON", () => {
  assert.equal(getLegacyMagicModePreference("{"), true);
});

test("getLegacyMagicModePreference falls back to true when magicEnabled is absent", () => {
  assert.equal(getLegacyMagicModePreference(JSON.stringify({ state: { step: 2 } })), true);
});

test("getAppearanceBootstrapScript includes safe fallback root attributes", () => {
  const script = getAppearanceBootstrapScript();

  assert.match(script, /setAttribute\("data-theme",\s*"aether"\)/);
  assert.match(script, /setAttribute\("data-color-scheme",\s*"light"\)/);
  assert.match(script, /setAttribute\("data-effects",\s*"full"\)/);
});

test("normalizeSystemColorScheme falls back to light when unavailable", () => {
  assert.equal(normalizeSystemColorScheme(undefined), "light");
});

test("getRootAppearanceAttributes returns the root data attribute contract", () => {
  assert.deepEqual(
    getRootAppearanceAttributes({
      selectedTheme: "high-contrast",
      systemScheme: "dark",
      magicEnabled: false,
    }),
    {
      "data-theme": "high-contrast",
      "data-color-scheme": "light",
      "data-effects": "reduced",
    }
  );
});
