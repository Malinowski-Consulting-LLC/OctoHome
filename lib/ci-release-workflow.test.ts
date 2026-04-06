import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readWorkflow() {
  return readFile(new URL("../.github/workflows/ci-release.yml", import.meta.url), "utf8");
}

function getJobBlock(workflow: string, jobName: string) {
  const header = `  ${jobName}:`;
  const start = workflow.indexOf(header);

  assert.notEqual(start, -1, `Expected the workflow to define the ${jobName} job`);

  const remainder = workflow.slice(start + header.length);
  const nextJobMatch = remainder.match(/\r?\n  [^#\s][^:]*:\r?\n/);
  const end = nextJobMatch ? start + header.length + nextJobMatch.index + 1 : workflow.length;

  return workflow.slice(start, end);
}

function getNamedStep(jobBlock: string, stepName: string) {
  const header = `      - name: ${stepName}`;
  const start = jobBlock.indexOf(header);

  assert.notEqual(start, -1, `Expected the workflow to define the ${stepName} step`);

  const remainder = jobBlock.slice(start + header.length);
  const nextStepMatch = remainder.match(/\r?\n      - name: /);
  const end = nextStepMatch ? start + header.length + nextStepMatch.index + 1 : jobBlock.length;

  return jobBlock.slice(start, end);
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

test("CI workflow runs the Node test suite in the ci job", async () => {
  const workflow = await readWorkflow();
  const ciJob = getJobBlock(workflow, "ci");

  assert.match(
    ciJob,
    /^      - name: Test\r?\n        run: node --test --experimental-strip-types \.\/lib\/\*\.test\.ts$/m
  );
});

test("CI workflow passes the stable toolchain to rust-toolchain", async () => {
  const workflow = await readWorkflow();
  const releaseJob = getJobBlock(workflow, "release");
  const installRustStep = getNamedStep(releaseJob, "Install Rust stable");

  assert.match(
    installRustStep,
    /^        uses: dtolnay\/rust-toolchain@e97e2d8cc328f1b50210efc529dca0028893a2d9 # v1$/m
  );
  assert.match(
    installRustStep,
    /^        with:\r?\n(?:          .*?\r?\n)*?          toolchain: stable$/m
  );
});
