import type { NextRequest } from "next/server";

import { getGitHubJwt } from "./auth-token";
import { UnauthorizedError } from "@/lib/api-errors";
import { serverEnv } from "@/lib/env";

export async function getGitHubAuthContext(request: NextRequest) {
  const token = await getGitHubJwt(request, serverEnv.AUTH_SECRET);

  return {
    accessToken: typeof token?.accessToken === "string" ? token.accessToken : null,
    login: typeof token?.login === "string" ? token.login : null,
  };
}

export async function requireGitHubAccessToken(request: NextRequest) {
  const { accessToken } = await getGitHubAuthContext(request);

  if (!accessToken) {
    throw new UnauthorizedError();
  }

  return accessToken;
}
