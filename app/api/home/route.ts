import { NextRequest, NextResponse } from "next/server";

import { UnauthorizedError, createApiErrorResponse } from "@/lib/api-errors";
import { findHomeRepo } from "@/lib/github";
import { getGitHubAuthContext } from "@/lib/server-auth";

/**
 * GET /api/home
 * Server-side discovery of the user's home-ops repo.
 * Never exposes the access token to the client.
 */
export async function GET(req: NextRequest) {
  try {
    const { accessToken, login } = await getGitHubAuthContext(req);

    if (!accessToken) throw new UnauthorizedError();

    if (!login) {
      return NextResponse.json({ repo: null });
    }

    const repo = await findHomeRepo(accessToken, login);

    return NextResponse.json({ repo });
  } catch (error) {
    return createApiErrorResponse(error);
  }
}
