import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const loadServerEnv = (overrides: Record<string, string>) => {
  const childEnv = { ...process.env, ...overrides };

  delete childEnv.GITHUB_ID;
  delete childEnv.GITHUB_SECRET;

  return spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      "import { serverEnv } from './lib/env.ts'; console.log(JSON.stringify(serverEnv));",
    ],
    {
      cwd: process.cwd(),
      env: childEnv,
      encoding: "utf8",
    }
  );
};

test("accepts GH_ID and GH_SECRET as aliases for GitHub OAuth settings", () => {
  const result = loadServerEnv({
    AUTH_SECRET: "test-auth-secret",
    GH_ID: "gh-id-placeholder",
    GH_SECRET: "gh-secret-placeholder",
    APP_URL: "https://example.com",
  });

  assert.equal(result.status, 0, result.stderr);

  const parsed = JSON.parse(result.stdout.trim()) as {
    GITHUB_ID: string;
    GITHUB_SECRET: string;
  };

  assert.equal(parsed.GITHUB_ID, "gh-id-placeholder");
  assert.equal(parsed.GITHUB_SECRET, "gh-secret-placeholder");
});
