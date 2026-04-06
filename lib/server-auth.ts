import type { NextRequest } from "next/server";

import { getGitHubJwt } from "./auth-token";
import { ApiError, UnauthorizedError } from "@/lib/api-errors";
import { findHomeRepo, type HomeRepoSummary } from "@/lib/github";
import { serverEnv } from "@/lib/env";
import {
  hasTrustedOrigin,
  resolveHomeRepoContext,
  type HomeRepoContext,
} from "./request-security";

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

type AuthContextResolver = typeof getGitHubAuthContext;
type HomeRepoResolver = (token: string, login: string) => Promise<HomeRepoSummary | null>;

export function assertTrustedOrigin(request: NextRequest, appUrl = serverEnv.APP_URL) {
  if (!hasTrustedOrigin(request, appUrl)) {
    throw new ApiError("Cross-site request blocked. Refresh the page and try again.", 403);
  }
}

export async function requireHomeRepoContext(
  request: NextRequest,
  dependencies: {
    getAuthContext?: AuthContextResolver;
    findRepo?: HomeRepoResolver;
  } = {}
): Promise<HomeRepoContext> {
  const resolution = await resolveHomeRepoContext(request, {
    getAuthContext: dependencies.getAuthContext ?? getGitHubAuthContext,
    findRepo: dependencies.findRepo ?? findHomeRepo,
  });

  if (resolution.kind === "unauthorized") {
    throw new UnauthorizedError();
  }

  if (resolution.kind === "missing-home-repo") {
    throw new ApiError(
      "Complete onboarding to create or connect your home-ops repository first.",
      409
    );
  }

  return resolution.context;
}
