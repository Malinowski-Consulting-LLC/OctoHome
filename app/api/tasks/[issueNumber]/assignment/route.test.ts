import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("assignment route reuses homeRepo viewer permissions", async () => {
  const route = await read("./route.ts");

  assert.match(route, /const \{ accessToken, owner, repo, homeRepo \} = await requireHomeRepoContext/);
  assert.match(route, /actorPermission: homeRepo\.viewer\.permission/);
});

test("assignment route validates issue numbers strictly", async () => {
  const route = await read("./route.ts");

  assert.match(route, /\/\^\\d\+\$\/\.test\(issueNumberParam\)/);
});
