import assert from "node:assert/strict";
import test from "node:test";

import { isNavItemActive, mobileNavTriggerPlacementClassName } from "./sidebar-nav.ts";

test("root nav item only matches the exact dashboard route", () => {
  assert.equal(isNavItemActive("/", "/"), true);
  assert.equal(isNavItemActive("/tasks", "/"), false);
});

test("section nav item stays active for nested routes", () => {
  assert.equal(isNavItemActive("/tasks", "/tasks"), true);
  assert.equal(isNavItemActive("/tasks/new", "/tasks"), true);
  assert.equal(isNavItemActive("/settings/profile", "/settings"), true);
});

test("section nav item does not match lookalike prefixes", () => {
  assert.equal(isNavItemActive("/tasksmith", "/tasks"), false);
  assert.equal(isNavItemActive("/family-room", "/family"), false);
});

test("mobile nav trigger sits away from the top-left header area", () => {
  assert.match(mobileNavTriggerPlacementClassName, /\bbottom-4\b/);
  assert.match(mobileNavTriggerPlacementClassName, /\bright-4\b/);
  assert.doesNotMatch(mobileNavTriggerPlacementClassName, /\btop-4\b/);
  assert.doesNotMatch(mobileNavTriggerPlacementClassName, /\bleft-4\b/);
});
