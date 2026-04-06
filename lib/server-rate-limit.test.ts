import assert from "node:assert/strict";
import test from "node:test";

import {
  RateLimitConfigurationError,
  RateLimitExceededError,
} from "./rate-limit.ts";
import { getRateLimitApiError } from "./rate-limit-error.ts";

test("getRateLimitApiError maps missing Upstash configuration to a 503 response", () => {
  const result = getRateLimitApiError(new RateLimitConfigurationError());

  assert.deepEqual(result, {
    status: 503,
    message:
      "Rate limiting is not configured for this deployment yet. Add the Upstash Redis environment variables and try again.",
  });
});

test("getRateLimitApiError maps throttled requests to a 429 response", () => {
  const result = getRateLimitApiError(new RateLimitExceededError(10, 0, 456));

  assert.deepEqual(result, {
    status: 429,
    message: "Too many requests. Please wait a moment and try again.",
  });
});

test("getRateLimitApiError ignores unrelated errors", () => {
  assert.equal(getRateLimitApiError(new Error("boom")), null);
});
