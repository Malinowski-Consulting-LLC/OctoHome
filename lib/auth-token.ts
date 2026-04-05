import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export type GitHubJwt = {
  accessToken?: string;
  login?: string;
};

function usesSecureAuthCookie(request: NextRequest) {
  return (
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  );
}

export async function getGitHubJwt(request: NextRequest, secret: string) {
  return (await getToken({
    req: request,
    secret,
    secureCookie: usesSecureAuthCookie(request),
  })) as GitHubJwt | null;
}
