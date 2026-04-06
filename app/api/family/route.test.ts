import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("family API exposes viewer metadata alongside the household members", async () => {
  const route = await read("./route.ts");

  assert.match(route, /return NextResponse\.json\(\{ members, viewer: homeRepo\.viewer \}\);/);
});

test("family API supports protected invite mutations via the shared invite helper", async () => {
  const route = await read("./route.ts");

  assert.match(route, /export async function POST\(req: NextRequest\)/);
  assert.match(route, /assertTrustedOrigin\(req\);/);
  assert.match(route, /enforceMutationRateLimit\(req,\s*\{[\s\S]*bucket: "family-invite"/);
  assert.match(route, /homeRepo\.viewer\.canManageFamily/);
  assert.match(route, /inviteFamilyMember\(/);
});
