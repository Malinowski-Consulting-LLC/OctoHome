import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("onboarding route validates invitedMembers as GitHub usernames", async () => {
  const route = await read("./route.ts");

  assert.match(route, /invitedMembers:[\s\S]*\.array\([\s\S]*\.regex\(\/\^\[A-Za-z0-9\]/);
});

test("onboarding route avoids logging raw invite usernames and GitHub messages", async () => {
  const route = await read("./route.ts");

  assert.doesNotMatch(route, /Failed to invite \$\{member\}: \$\{result\.message\}/);
});
