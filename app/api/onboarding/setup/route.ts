import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { UnauthorizedError, createApiErrorResponse } from "@/lib/api-errors";
import {
  commitFile,
  createRepo,
  fetchStats,
  inviteFamilyMember,
  setupDefaultLabels,
  waitForRepo,
} from "@/lib/github";
import { enforceMutationRateLimit } from "@/lib/server-rate-limit";
import { assertTrustedOrigin, getGitHubAuthContext } from "@/lib/server-auth";

const setupSchema = z.object({
  householdName: z.string().trim().min(1).max(100),
  isOrg: z.boolean(),
  /** Required when isOrg is true. Must be an existing GitHub org login. */
  orgLogin: z
    .string()
    .trim()
    .min(1)
    .max(39)
    .regex(/^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$/, "Invalid GitHub organization login")
    .optional(),
  invitedMembers: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(39)
        .regex(/^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$/, "Enter a valid GitHub username.")
    )
    .max(50)
    .default([]),
});

/**
 * POST /api/onboarding/setup
 * Creates (or reuses) the home-ops repository, sets up default labels,
 * initializes stats, and invites family members — all server-side.
 */
export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const { accessToken, login } = await getGitHubAuthContext(req);

    if (!accessToken) throw new UnauthorizedError();

    if (!login) {
      return NextResponse.json(
        { error: "Could not determine your GitHub login. Please sign in again." },
        { status: 401 }
      );
    }

    await enforceMutationRateLimit(req, {
      bucket: "onboarding-setup",
      login,
      limit: 5,
      window: "1 h",
    });

    const body = setupSchema.parse(await req.json());
    const { householdName, isOrg, orgLogin, invitedMembers } = body;

    if (isOrg && !orgLogin) {
      return NextResponse.json(
        { error: "An organization login is required when using organization storage." },
        { status: 400 }
      );
    }

    const owner = (isOrg && orgLogin) ? orgLogin : login;
    const repoName = "home-ops";

    // Create repo if it doesn't already exist
    let repoCreated = false;
    try {
      await createRepo(accessToken, repoName, isOrg ? orgLogin : undefined);
      repoCreated = true;
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      if (status !== 422 && status !== 409) {
        // 422/409 = already exists — that's fine, we'll use the existing repo
        throw e;
      }
    }

    // Wait for the repo to become accessible
    const ready = await waitForRepo(accessToken, owner, repoName, 4);
    if (!ready) {
      return NextResponse.json(
        {
          error:
            "The repository was created but is not yet accessible. Please wait a moment and try again.",
          retryable: true,
        },
        { status: 503 }
      );
    }

    // Set up default household labels
    await setupDefaultLabels(accessToken, owner, repoName);

    // Initialize stats.json only if it does not exist yet
    const { sha: existingSha } = await fetchStats(accessToken, owner, repoName);
    if (!existingSha) {
      const initialStats = {
        household: householdName,
        members: {},
        createdAt: new Date().toISOString(),
      };
      await commitFile(
        accessToken,
        owner,
        repoName,
        "stats.json",
        JSON.stringify(initialStats, null, 2),
        "chore: initialize household stats"
      );
    }

    // Invite family members concurrently (failures are soft — reported but don't abort)
    const inviteResults = await Promise.all(
      invitedMembers.map(async (member) => {
        const result = await inviteFamilyMember(accessToken, owner, repoName, member, isOrg);
        if (!result.success) {
          console.error("[onboarding-invite-failed]");
        }
        return result;
      })
    );

    return NextResponse.json({
      success: true,
      repoOwner: owner,
      repoName,
      repoCreated,
      inviteResults,
    });
  } catch (error) {
    return createApiErrorResponse(error);
  }
}
