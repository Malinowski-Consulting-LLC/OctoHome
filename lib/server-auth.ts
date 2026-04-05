import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

import { UnauthorizedError } from "@/lib/api-errors";
import { serverEnv } from "@/lib/env";

type GitHubJwt = {
  accessToken?: string;
  login?: string;
};

export async function getGitHubAuthContext(request: NextRequest) {
  const token = (await getToken({
    req: request,
    secret: serverEnv.AUTH_SECRET,
  })) as GitHubJwt | null;

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
