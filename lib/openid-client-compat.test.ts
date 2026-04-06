import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();
const openIdPackagePath = path.join(projectRoot, "node_modules", "openid-client", "package.json");
const openIdPackage = JSON.parse(readFileSync(openIdPackagePath, "utf8")) as { version: string };
const patchPath = path.join(projectRoot, "patches", `openid-client+${openIdPackage.version}.patch`);
const patchedFiles = [
  path.join(projectRoot, "node_modules", "openid-client", "lib", "client.js"),
  path.join(projectRoot, "node_modules", "openid-client", "lib", "issuer.js"),
  path.join(projectRoot, "node_modules", "openid-client", "lib", "passport_strategy.js"),
];

test("openid-client has a patch-package patch for the installed version", () => {
  assert.equal(
    existsSync(patchPath),
    true,
    `Missing patch-package patch for openid-client ${openIdPackage.version}`
  );
});

test("installed openid-client does not use deprecated url.parse", () => {
  for (const filePath of patchedFiles) {
    const source = readFileSync(filePath, "utf8");

    assert.doesNotMatch(source, /\burl\.parse\(/, `${path.basename(filePath)} still uses url.parse()`);
  }
});
