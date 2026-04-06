import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("useResolvedHomeRepo re-discovers when viewer metadata is missing", async () => {
  const source = await readFile(new URL("./use-resolved-home-repo.ts", import.meta.url), "utf8");

  assert.match(
    source,
    /const shouldDiscover =[\s\S]*!viewer[\s\S]*refreshKey > 0/
  );
});
