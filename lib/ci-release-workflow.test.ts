import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkflow() {
  return readFile(new URL("../.github/workflows/ci-release.yml", import.meta.url), "utf8");
}

test("CI workflow pins actions/checkout to the v6.0.2 commit for checkout", async () => {
  const workflow = await readWorkflow();

  assert.match(
    workflow,
    /actions\/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6\.0\.2/
  );
});

test("CI workflow pins actions/setup-node to the v6.3.0 commit for setup-node", async () => {
  const workflow = await readWorkflow();

  assert.match(
    workflow,
    /actions\/setup-node@53b83947a5a98c8d113130e565377fae1a50d02f # v6\.3\.0/
  );
});
