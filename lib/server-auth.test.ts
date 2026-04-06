import assert from "node:assert/strict";
import test from "node:test";

test("reads the secure Auth.js session cookie on HTTPS requests", async () => {
  const secret = "test-auth-secret";

  const { encode } = await import("next-auth/jwt");
  const { NextRequest } = await import("next/server.js");
  const { getGitHubJwt } = await import("./auth-token.ts");

  const cookieName = "__Secure-next-auth.session-token";
  const token = await encode({
    secret,
    token: {
      accessToken: "access-token",
      login: "octocat",
    },
  });

  const request = new NextRequest("https://example.com/api/home", {
    headers: {
      cookie: `${cookieName}=${token}`,
    },
  });

  const authContext = await getGitHubJwt(request, secret);

  assert.equal(authContext.accessToken, "access-token");
  assert.equal(authContext.login, "octocat");
});

test("resolveHomeRepoContext resolves the authenticated user's canonical home repo", async () => {
  const { NextRequest } = await import("next/server.js");
  const { resolveHomeRepoContext } = await import("./request-security.ts");

  const request = new NextRequest("https://octohome.vercel.app/api/tasks?owner=evil&repo=repo");
  const homeRepo = {
    owner: "octocat",
    name: "home-ops",
    updatedAt: "2026-04-06T00:00:00.000Z",
    isPrivate: true,
    bootstrap: null,
  };

  const result = await resolveHomeRepoContext(request, {
    getAuthContext: async () => ({
      accessToken: "access-token",
      login: "octocat",
    }),
    findRepo: async () => homeRepo,
  });

  assert.deepEqual(result, {
    kind: "ok",
    context: {
      accessToken: "access-token",
      login: "octocat",
      owner: "octocat",
      repo: "home-ops",
      homeRepo,
    },
  });
});

test("resolveHomeRepoContext reports a missing home repo when onboarding is incomplete", async () => {
  const { NextRequest } = await import("next/server.js");
  const { resolveHomeRepoContext } = await import("./request-security.ts");

  const request = new NextRequest("https://octohome.vercel.app/api/tasks");

  const result = await resolveHomeRepoContext(request, {
    getAuthContext: async () => ({
      accessToken: "access-token",
      login: "octocat",
    }),
    findRepo: async () => null,
  });

  assert.deepEqual(result, { kind: "missing-home-repo" });
});

test("resolveHomeRepoContext forwards an explicit repo owner hint for org households", async () => {
  const { NextRequest } = await import("next/server.js");
  const { resolveHomeRepoContext } = await import("./request-security.ts");

  const request = new NextRequest("https://octohome.vercel.app/api/tasks", {
    headers: {
      "x-octohome-repo-owner": "octo-org",
    },
  });

  let preferredOwner: string | undefined;
  const homeRepo = {
    owner: "octo-org",
    name: "home-ops",
    updatedAt: "2026-04-06T00:00:00.000Z",
    isPrivate: true,
    bootstrap: null,
  };

  const result = await resolveHomeRepoContext(request, {
    getAuthContext: async () => ({
      accessToken: "access-token",
      login: "octocat",
    }),
    findRepo: async (_token, _login, preferred) => {
      preferredOwner = preferred;
      return homeRepo;
    },
  });

  assert.equal(preferredOwner, "octo-org");
  assert.deepEqual(result, {
    kind: "ok",
    context: {
      accessToken: "access-token",
      login: "octocat",
      owner: "octo-org",
      repo: "home-ops",
      homeRepo,
    },
  });
});

test("hasTrustedOrigin allows the request origin derived from Vercel forwarding headers", async () => {
  const { NextRequest } = await import("next/server.js");
  const { hasTrustedOrigin } = await import("./request-security.ts");

  const request = new NextRequest("http://127.0.0.1/api/tasks", {
    method: "POST",
    headers: {
      origin: "https://octohome.vercel.app",
      "x-forwarded-host": "octohome.vercel.app",
      "x-forwarded-proto": "https",
    },
  });

  assert.equal(hasTrustedOrigin(request), true);
});

test("hasTrustedOrigin falls back to the referer origin when the origin header is absent", async () => {
  const { NextRequest } = await import("next/server.js");
  const { hasTrustedOrigin } = await import("./request-security.ts");

  const request = new NextRequest("https://octohome.vercel.app/api/tasks", {
    method: "POST",
    headers: {
      referer: "https://octohome.vercel.app/tasks/new",
    },
  });

  assert.equal(hasTrustedOrigin(request), true);
});

test("hasTrustedOrigin blocks cross-site requests", async () => {
  const { NextRequest } = await import("next/server.js");
  const { hasTrustedOrigin } = await import("./request-security.ts");

  const request = new NextRequest("https://octohome.vercel.app/api/tasks", {
    method: "POST",
    headers: {
      origin: "https://evil.example",
    },
  });

  assert.equal(hasTrustedOrigin(request), false);
});

test("hasTrustedOrigin blocks mutation requests without origin metadata", async () => {
  const { NextRequest } = await import("next/server.js");
  const { hasTrustedOrigin } = await import("./request-security.ts");

  const request = new NextRequest("https://octohome.vercel.app/api/tasks", {
    method: "POST",
  });

  assert.equal(hasTrustedOrigin(request), false);
});
