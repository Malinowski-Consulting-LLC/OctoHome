import assert from "node:assert/strict";
import test from "node:test";

test("reads the secure Auth.js session cookie on HTTPS requests", async () => {
  const secret = "test-auth-secret";

  const { encode } = await import("@auth/core/jwt");
  const { NextRequest } = await import("next/server.js");
  const { getGitHubJwt } = await import("./auth-token.ts");

  const cookieName = "__Secure-authjs.session-token";
  const token = await encode({
    secret,
    salt: cookieName,
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
