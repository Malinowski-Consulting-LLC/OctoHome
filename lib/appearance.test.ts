import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import test from "node:test";

import {
  getAppearanceBootstrapScript,
  getRootAppearanceAttributes,
  getLegacyMagicModePreference,
  normalizeStoredTheme,
  normalizeSystemColorScheme,
  getSystemColorSchemeFromPreference,
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

test("resolveAppearanceState defaults to aether light full", () => {
  assert.deepEqual(resolveAppearanceState({}), {
    theme: "aether",
    colorScheme: "light",
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

test("getAppearanceBootstrapScript applies persisted appearance state at runtime", () => {
  const attrs: Record<string, string> = {};
  const script = getAppearanceBootstrapScript();

  runInNewContext(script, {
    document: {
      documentElement: {
        setAttribute: (name: string, value: string) => {
          attrs[name] = value;
        },
      },
    },
    localStorage: {
      getItem: (key: string) => {
        if (key === "octohome-appearance") {
          return JSON.stringify({
            state: {
              selectedTheme: "high-contrast",
              magicEnabled: false,
            },
          });
        }
        return null;
      },
    },
    window: {
      matchMedia: () => ({ matches: true }),
    },
  });

  assert.deepEqual(attrs, {
    "data-theme": "high-contrast",
    "data-color-scheme": "light",
    "data-effects": "reduced",
  });
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

test("getSystemColorSchemeFromPreference maps matchMedia state to the scheme", () => {
  assert.equal(getSystemColorSchemeFromPreference(true), "dark");
  assert.equal(getSystemColorSchemeFromPreference(false), "light");
});
