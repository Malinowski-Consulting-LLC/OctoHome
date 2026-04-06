import assert from "node:assert/strict";
import test from "node:test";

import {
  RateLimitConfigurationError,
  RateLimitExceededError,
  enforceRateLimit,
  getRateLimitIdentifier,
} from "./rate-limit.ts";

function createRequest(headers: Record<string, string> = {}) {
  return {
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
  };
}

test("getRateLimitIdentifier prefers the authenticated login", () => {
  const request = createRequest({
    "x-forwarded-for": "203.0.113.12",
  });

  assert.equal(getRateLimitIdentifier(request, "OctoCat"), "user:octocat");
});

test("getRateLimitIdentifier falls back to the first forwarded IP", () => {
  const request = createRequest({
    "x-forwarded-for": "203.0.113.12, 198.51.100.4",
  });

  assert.equal(getRateLimitIdentifier(request), "ip:203.0.113.12");
});

test("enforceRateLimit skips enforcement outside production when Upstash is not configured", async () => {
  const request = createRequest();

  const result = await enforceRateLimit(request, {
    bucket: "tasks-create",
    env: {
      nodeEnv: "development",
    },
  });

  assert.deepEqual(result, {
    applied: false,
    identifier: "anonymous",
  });
});

test("enforceRateLimit fails closed in production when Upstash is not configured", async () => {
  const request = createRequest();

  await assert.rejects(
    enforceRateLimit(request, {
      bucket: "tasks-create",
      env: {
        nodeEnv: "production",
      },
    }),
    RateLimitConfigurationError
  );
});

test("enforceRateLimit uses a bucket-prefixed key when the limiter succeeds", async () => {
  const request = createRequest();
  let receivedKey = "";

  const result = await enforceRateLimit(request, {
    bucket: "tasks-create",
    login: "octocat",
    env: {
      nodeEnv: "production",
      upstashUrl: "https://upstash.example",
      upstashToken: "token",
    },
    limit: async (key) => {
      receivedKey = key;
      return {
        success: true,
        limit: 20,
        remaining: 19,
        reset: 123,
      };
    },
  });

  assert.equal(receivedKey, "tasks-create:user:octocat");
  assert.deepEqual(result, {
    applied: true,
    identifier: "user:octocat",
    limit: 20,
    remaining: 19,
    reset: 123,
  });
});

test("enforceRateLimit raises a dedicated error when the limiter rejects the request", async () => {
  const request = createRequest();

  await assert.rejects(
    enforceRateLimit(request, {
      bucket: "ai-create",
      env: {
        nodeEnv: "production",
        upstashUrl: "https://upstash.example",
        upstashToken: "token",
      },
      limit: async () => ({
        success: false,
        limit: 10,
        remaining: 0,
        reset: 456,
      }),
    }),
    (error: unknown) => {
      assert.ok(error instanceof RateLimitExceededError);
      assert.equal(error.limit, 10);
      assert.equal(error.remaining, 0);
      assert.equal(error.reset, 456);
      return true;
    }
  );
});
