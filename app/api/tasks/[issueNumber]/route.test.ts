import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("task completion route enforces completion permissions from the current assignees", async () => {
  const route = await read("./route.ts");

  assert.match(route, /canCompleteTask\(\{/);
  assert.match(route, /const currentTask = await fetchTask\(/);
});

test("task completion route credits points to the resolved completion recipient", async () => {
  const route = await read("./route.ts");

  assert.match(route, /const creditedLogin = resolveTaskCompletionCreditLogin\(/);
  assert.match(route, /updateMemberStats\(accessToken, owner, repo, creditedLogin, 50\)/);
});

test("task completion route rejects already-closed tasks before awarding points", async () => {
  const route = await read("./route.ts");

  assert.match(route, /currentTask\.state !== "open"/);
  assert.match(route, /This task is already completed\./);
});
