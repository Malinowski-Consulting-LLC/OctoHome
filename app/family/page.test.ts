import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("family page includes an invite management surface", async () => {
  const page = await read("./page.tsx");

  assert.match(page, /Invite a family member/);
  assert.match(page, /name="username"/);
  assert.match(page, /Only household managers can invite new members\./);
});

test("family page submits invites to the family API and refreshes the member list", async () => {
  const page = await read("./page.tsx");

  assert.match(page, /fetch\("\/api\/family", \{[\s\S]*method: "POST"/);
  assert.match(page, /await loadFamily\(\);/);
  assert.match(page, /setInviteNotice\(/);
});
