import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, UnauthorizedError, createApiErrorResponse } from "@/lib/api-errors";
import { fetchFamilyMembers, inviteFamilyMember } from "@/lib/github";
import { enforceMutationRateLimit } from "@/lib/server-rate-limit";
import { assertTrustedOrigin, getGitHubAuthContext, requireHomeRepoContext } from "@/lib/server-auth";

const inviteBodySchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "GitHub username is required.")
    .max(39, "GitHub usernames must be 39 characters or fewer.")
    .regex(/^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$/, "Enter a valid GitHub username."),
});

/**
 * GET /api/family
 * Returns collaborator list enriched with points/streak from stats.json.
 */
export async function GET(req: NextRequest) {
  try {
    const { accessToken, owner, repo, homeRepo } = await requireHomeRepoContext(req);

    try {
      const members = await fetchFamilyMembers(accessToken, owner, repo);
      return NextResponse.json({ members, viewer: homeRepo.viewer });
    } catch (e) {
      if ((e as { status?: number })?.status === 403) {
        throw new ApiError(
          "Household member details are only available to repository managers for this repository.",
          403
        );
      }
      throw e;
    }
  } catch (error) {
    return createApiErrorResponse(error);
  }
}

/**
 * POST /api/family
 * Invites a new collaborator to the authenticated user's household repository.
 */
export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const authContext = await getGitHubAuthContext(req);

    if (!authContext.accessToken || !authContext.login) {
      throw new UnauthorizedError();
    }

    await enforceMutationRateLimit(req, {
      bucket: "family-invite",
      login: authContext.login,
      limit: 20,
      window: "1 h",
    });

    const { accessToken, owner, repo, homeRepo } = await requireHomeRepoContext(req, {
      getAuthContext: async () => authContext,
    });

    if (!homeRepo.viewer.canManageFamily) {
      throw new ApiError("Only repository managers can invite new family members.", 403);
    }

    const { username } = inviteBodySchema.parse(await req.json());
    const result = await inviteFamilyMember(
      accessToken,
      owner,
      repo,
      username,
      homeRepo.isOrg
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(
      { result },
      { status: result.status === "invited" ? 201 : 200 }
    );
  } catch (error) {
    return createApiErrorResponse(error);
  }
}
