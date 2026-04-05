/**
 * CSS contract tests for app/globals.css.
 * Asserts that the required theme selector blocks and semantic tokens exist.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(__dirname, "globals.css"), "utf8");

test("globals.css: :root defines Aether light semantic tokens", () => {
  assert.ok(css.includes(":root"), "Missing :root selector");
  assert.ok(css.includes("--app-bg"), "Missing --app-bg token in :root");
  assert.ok(css.includes("--text-1"), "Missing --text-1 token");
  assert.ok(css.includes("--surface-1"), "Missing --surface-1 token");
  assert.ok(css.includes("--ring-color"), "Missing --ring-color token");
  assert.ok(css.includes("--shell-rail-width"), "Missing --shell-rail-width token");
});

test("globals.css: Aether dark block is defined", () => {
  assert.match(
    css,
    /\[data-theme="aether"\]\[data-color-scheme="dark"\]/,
    'Missing [data-theme="aether"][data-color-scheme="dark"] selector'
  );
});

test("globals.css: High Contrast block is defined (no data-color-scheme)", () => {
  assert.match(
    css,
    /\[data-theme="high-contrast"\]\s*\{/,
    'Missing [data-theme="high-contrast"] { selector'
  );
  // High Contrast must NOT have a [data-color-scheme] qualifier on its own block
  assert.doesNotMatch(
    css,
    /\[data-theme="high-contrast"\]\[data-color-scheme/,
    "High Contrast block must not be gated on data-color-scheme"
  );
});

test("globals.css: effect-budget rules disable animations under [data-effects='reduced']", () => {
  assert.match(
    css,
    /\[data-effects="reduced"\]/,
    "Missing [data-effects='reduced'] selector"
  );
  assert.match(
    css,
    /\[data-effects="reduced"\].*animate-pulse-slow/s,
    "animate-pulse-slow not in reduced-effects rule"
  );
  assert.match(
    css,
    /\[data-effects="reduced"\].*animate-shimmer/s,
    "animate-shimmer not in reduced-effects rule"
  );
  assert.match(
    css,
    /\[data-effects="reduced"\].*\[data-magic-effect\]/s,
    "[data-magic-effect] not in reduced-effects rule"
  );
});

test("globals.css: hero-surface clips overflow", () => {
  assert.match(css, /\.hero-surface/, "Missing .hero-surface rule");
  assert.match(
    css,
    /(?:\.hero-surface|\[data-card-role="hero"\])[\s\S]*?overflow:\s*hidden/,
    "Missing overflow: hidden on hero-surface"
  );
});

test("globals.css: High Contrast disables magic-effect filters", () => {
  assert.match(
    css,
    /\[data-theme="high-contrast"\]\s+\[data-magic-effect\]/,
    'Missing [data-theme="high-contrast"] [data-magic-effect] rule'
  );
  assert.match(
    css,
    /\[data-theme="high-contrast"\][\s\S]*?\[data-magic-effect\][\s\S]*?filter:\s*none/,
    "Missing filter: none in high-contrast magic-effect rule"
  );
});

test("globals.css: Tailwind color-background remaps to --app-bg semantic token", () => {
  assert.match(
    css,
    /--color-background:\s*var\(--app-bg\)/,
    "--color-background must reference --app-bg semantic token"
  );
});

test("globals.css: Tailwind color-foreground remaps to --text-1 semantic token", () => {
  assert.match(
    css,
    /--color-foreground:\s*var\(--text-1\)/,
    "--color-foreground must reference --text-1 semantic token"
  );
});

test("globals.css: no standalone aether light data-theme block (should be :root only)", () => {
  assert.doesNotMatch(
    css,
    /\[data-theme="aether"\]\[data-color-scheme="light"\]/,
    "Aether light must use :root, not [data-theme='aether'][data-color-scheme='light']"
  );
});
