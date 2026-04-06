import assert from "node:assert/strict";
import test from "node:test";

import { buildContentSecurityPolicy, getSecurityHeaders } from "./security-headers.ts";

test("buildContentSecurityPolicy adds development-only allowances for local HMR", () => {
  const csp = buildContentSecurityPolicy("development");

  assert.match(csp, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
  assert.match(csp, /connect-src 'self' ws: wss: http:\/\/localhost:3000 http:\/\/127\.0\.0\.1:3000/);
  assert.doesNotMatch(csp, /upgrade-insecure-requests/);
});

test("buildContentSecurityPolicy hardens production without unsafe-eval", () => {
  const csp = buildContentSecurityPolicy("production");

  assert.match(csp, /default-src 'self'/);
  assert.match(
    csp,
    /img-src 'self' data: blob: https:\/\/avatars\.githubusercontent\.com https:\/\/\*\.githubusercontent\.com/
  );
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /upgrade-insecure-requests/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.doesNotMatch(csp, /img-src 'self' data: blob: https:(?:;|$)/);
});

test("getSecurityHeaders includes the expected response headers for production", () => {
  const headers = getSecurityHeaders("production");

  assert.equal(headers["Content-Security-Policy"].includes("default-src 'self'"), true);
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["Cross-Origin-Opener-Policy"], "same-origin");
  assert.equal(headers["Strict-Transport-Security"], "max-age=63072000; includeSubDomains; preload");
});

test("getSecurityHeaders omits HSTS outside production", () => {
  const headers = getSecurityHeaders("development");

  assert.equal("Strict-Transport-Security" in headers, false);
});
