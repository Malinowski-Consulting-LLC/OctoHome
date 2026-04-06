import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("root layout delegates session context to a client wrapper", async () => {
  const layout = await read("./layout.tsx");

  assert.doesNotMatch(layout, /import \{ SessionProvider \} from "next-auth\/react"/);
  assert.match(layout, /import \{ RootProviders \} from "@\/components\/root-providers"/);
  assert.match(layout, /<RootProviders session=\{session\}>\{children\}<\/RootProviders>/);
});

test("root providers is a client component that owns SessionProvider", async () => {
  const providers = await read("../components/root-providers.tsx");

  assert.match(providers, /^"use client";/);
  assert.match(providers, /import \{ SessionProvider \} from "next-auth\/react"/);
  assert.match(providers, /<SessionProvider session=\{session\}>/);
});
