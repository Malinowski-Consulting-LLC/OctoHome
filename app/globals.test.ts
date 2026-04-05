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

test("globals.css: Aether dark block includes --ring-color override", () => {
  // Extract the dark block content to assert the token is defined there, not just in :root
  const darkBlockMatch = css.match(
    /\[data-theme="aether"\]\[data-color-scheme="dark"\]\s*\{([^}]+)\}/s
  );
  assert.ok(darkBlockMatch, "Could not locate Aether dark block");
  assert.ok(
    darkBlockMatch[1].includes("--ring-color"),
    "--ring-color must be overridden in the Aether dark block"
  );
});

test("globals.css: reduced-effects budget covers .animate-beam", () => {
  assert.match(
    css,
    /\[data-effects="reduced"\].*animate-beam/s,
    ".animate-beam not covered by [data-effects='reduced'] rule"
  );
});

test("globals.css: reduced-effects [data-magic-effect] clears filter and backdrop-filter", () => {
  // The reduced-effects magic-effect rule must clear visual filters
  const reducedMagicMatch = css.match(
    /\[data-effects="reduced"\][^{]*\[data-magic-effect\][^{]*\{([^}]+)\}/s
  );
  assert.ok(
    reducedMagicMatch,
    "Could not locate [data-effects='reduced'] [data-magic-effect] rule block"
  );
  const block = reducedMagicMatch[1];
  assert.match(
    block,
    /filter:\s*none/,
    "filter: none missing from reduced-effects [data-magic-effect] rule"
  );
  assert.match(
    block,
    /backdrop-filter:\s*none/,
    "backdrop-filter: none missing from reduced-effects [data-magic-effect] rule"
  );
});

test("globals.css: @media prefers-reduced-motion: reduce disables approved animation surfaces", () => {
  assert.match(
    css,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
    "Missing @media (prefers-reduced-motion: reduce) block"
  );
  const mediaMatch = css.match(
    /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]+?)^}/m
  );
  assert.ok(mediaMatch, "Could not extract prefers-reduced-motion block content");
  const block = mediaMatch[1];
  assert.ok(block.includes("animate-pulse-slow"), "animate-pulse-slow not in reduced-motion media query");
  assert.ok(block.includes("animate-shimmer"), "animate-shimmer not in reduced-motion media query");
  assert.ok(block.includes("animate-beam"), "animate-beam not in reduced-motion media query");
  assert.ok(block.includes("data-magic-effect"), "[data-magic-effect] not in reduced-motion media query");
  assert.match(block, /filter:\s*none/, "filter: none missing from reduced-motion media query");
  assert.match(block, /backdrop-filter:\s*none/, "backdrop-filter: none missing from reduced-motion media query");
});
