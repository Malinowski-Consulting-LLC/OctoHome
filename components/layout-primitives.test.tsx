/**
 * Minimal node test for layout primitives (TDD).
 * Run: npx tsx components/layout-primitives.test.tsx
 *
 * Uses react-dom/server renderToStaticMarkup — no DOM, no browser APIs.
 * RepoRequiredState is not tested here because it depends on next/link,
 * which is not resolvable outside the Next.js runtime without mocking;
 * its structural refactor is validated by the lint + build checks instead.
 */
import { renderToStaticMarkup } from "react-dom/server";
import assert from "node:assert/strict";
import React from "react";

import { PageHeader } from "./page-header.js";
import { SurfaceCard } from "./surface-card.js";
import { MetricCard } from "./metric-card.js";
import { ActionGroup } from "./action-group.js";
import { BoardColumnShell } from "./board-column-shell.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}: ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

// ── PageHeader ────────────────────────────────────────────────────────────────

test("PageHeader renders title", () => {
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, { title: "My Page" })
  );
  assert.ok(html.includes("My Page"), `Expected 'My Page' in: ${html}`);
  assert.ok(html.includes("<header"), `Expected <header> element`);
  assert.ok(html.includes("<h1"), `Expected <h1> element`);
});

test("PageHeader renders subtitle when provided", () => {
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, { title: "T", subtitle: "The subtitle" })
  );
  assert.ok(html.includes("The subtitle"), `Expected subtitle in: ${html}`);
  assert.ok(html.includes("<p"), `Expected <p> element for subtitle`);
});

test("PageHeader omits subtitle element when not provided", () => {
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, { title: "T" })
  );
  assert.ok(!html.includes("<p"), `Expected no <p> when subtitle absent`);
});

test("PageHeader wraps actions in ActionGroup", () => {
  const html = renderToStaticMarkup(
    React.createElement(PageHeader, {
      title: "T",
      actions: React.createElement("button", null, "Act"),
    })
  );
  assert.ok(html.includes("Act"), `Expected actions content`);
  // ActionGroup renders a <div> with flex classes
  assert.ok(html.includes("flex"), `Expected flex wrapper from ActionGroup`);
});

// ── ActionGroup ───────────────────────────────────────────────────────────────

test("ActionGroup renders children in a flex div", () => {
  const html = renderToStaticMarkup(
    React.createElement(ActionGroup, null, React.createElement("button", null, "X"))
  );
  assert.ok(html.includes("flex"), `Expected flex class`);
  assert.ok(html.includes("<button"), `Expected child button`);
});

// ── SurfaceCard ───────────────────────────────────────────────────────────────

test("SurfaceCard renders a <section> with surface-1 token class", () => {
  const html = renderToStaticMarkup(
    React.createElement(SurfaceCard, null, React.createElement("span", null, "content"))
  );
  assert.ok(html.includes("<section"), `Expected <section>`);
  assert.ok(html.includes("surface-1"), `Expected surface-1 token`);
  assert.ok(html.includes("content"), `Expected children`);
});

test("SurfaceCard tone=subtle adds surface-2 class", () => {
  const html = renderToStaticMarkup(
    React.createElement(SurfaceCard, { tone: "subtle" }, "x")
  );
  assert.ok(html.includes("surface-2"), `Expected surface-2 class for subtle tone`);
});

test("SurfaceCard tone=accent adds accent-gradient class", () => {
  const html = renderToStaticMarkup(
    React.createElement(SurfaceCard, { tone: "accent" }, "x")
  );
  assert.ok(html.includes("accent-gradient"), `Expected accent-gradient class for accent tone`);
});

test("SurfaceCard forwards extra className", () => {
  const html = renderToStaticMarkup(
    React.createElement(SurfaceCard, { className: "extra-test-class" }, "x")
  );
  assert.ok(html.includes("extra-test-class"), `Expected forwarded className`);
});

// ── MetricCard ────────────────────────────────────────────────────────────────

test("MetricCard renders label and value", () => {
  const html = renderToStaticMarkup(
    React.createElement(MetricCard, {
      label: "Open Issues",
      value: "42",
      icon: React.createElement("span", null, "★"),
    })
  );
  assert.ok(html.includes("Open Issues"), `Expected label`);
  assert.ok(html.includes("42"), `Expected value`);
  assert.ok(html.includes("★"), `Expected icon`);
});

test("MetricCard renders inside a SurfaceCard (has surface-1 token)", () => {
  const html = renderToStaticMarkup(
    React.createElement(MetricCard, {
      label: "L",
      value: "0",
      icon: React.createElement("span", null, "i"),
    })
  );
  assert.ok(html.includes("surface-1"), `Expected surface-1 from SurfaceCard wrapper`);
});

// ── BoardColumnShell ──────────────────────────────────────────────────────────

test("BoardColumnShell renders title and count", () => {
  const html = renderToStaticMarkup(
    React.createElement(BoardColumnShell, { title: "In Progress", count: 7 },
      React.createElement("p", null, "card")
    )
  );
  assert.ok(html.includes("In Progress"), `Expected column title`);
  assert.ok(html.includes("7"), `Expected column count`);
  assert.ok(html.includes("card"), `Expected children`);
});

test("BoardColumnShell has data-board-column attribute", () => {
  const html = renderToStaticMarkup(
    React.createElement(BoardColumnShell, { title: "T", count: 0 }, "x")
  );
  assert.ok(html.includes("data-board-column"), `Expected data-board-column attribute`);
});

test("BoardColumnShell is backed by SurfaceCard (has surface-1 token)", () => {
  const html = renderToStaticMarkup(
    React.createElement(BoardColumnShell, { title: "T", count: 0 }, "x")
  );
  assert.ok(html.includes("surface-1"), `Expected surface-1 from SurfaceCard backing`);
});

test("BoardColumnShell count badge uses token-backed pill (interactive-bg + muted-foreground)", () => {
  const html = renderToStaticMarkup(
    React.createElement(BoardColumnShell, { title: "T", count: 5 }, "x")
  );
  assert.ok(
    html.includes("interactive-bg"),
    `Expected interactive-bg token on count pill, got: ${html}`
  );
  assert.ok(
    html.includes("muted-foreground"),
    `Expected muted-foreground token on count pill, got: ${html}`
  );
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
