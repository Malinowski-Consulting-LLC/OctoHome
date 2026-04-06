import { NextRequest, NextResponse } from "next/server";

import { ApiError, createApiErrorResponse } from "@/lib/api-errors";
import { fetchStats, getOctokit } from "@/lib/github";
import type { StoredMemberStats } from "@/lib/member-stats";
import { requireHomeRepoContext } from "@/lib/server-auth";
import type { FamilyMember } from "@/lib/types";

/**
 * GET /api/family
 * Returns collaborator list enriched with points/streak from stats.json.
 */
export async function GET(req: NextRequest) {
  try {
    const { accessToken, owner, repo } = await requireHomeRepoContext(req);
    const octokit = getOctokit(accessToken);

    // Collaborator listing requires push access. Catch 403 explicitly so the
    // client receives a clear message instead of a generic 500.
    let collabs: Awaited<
      ReturnType<typeof octokit.repos.listCollaborators>
    >["data"];
    try {
      const { data } = await octokit.repos.listCollaborators({ owner, repo });
      collabs = data;
    } catch (e) {
      if ((e as { status?: number })?.status === 403) {
        throw new ApiError(
          "You do not have permission to list collaborators for this repository.",
          403
        );
      }
      throw e;
    }

    const { stats } = await fetchStats(accessToken, owner, repo);
    const memberStats = stats.members as Record<string, StoredMemberStats | undefined>;

    const members: FamilyMember[] = collabs.map((c) => ({
      login: c.login,
      avatar_url: c.avatar_url,
      points: memberStats[c.login]?.points ?? 0,
      streak: memberStats[c.login]?.streak ?? 0,
    }));

    return NextResponse.json({ members });
  } catch (error) {
    return createApiErrorResponse(error);
  }
}
