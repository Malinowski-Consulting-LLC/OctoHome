import { NextRequest, NextResponse } from "next/server";

import { ApiError, UnauthorizedError, createApiErrorResponse } from "@/lib/api-errors";
import { completeTask, updateMemberStats } from "@/lib/github";
import { enforceMutationRateLimit } from "@/lib/server-rate-limit";
import { assertTrustedOrigin, getGitHubAuthContext, requireHomeRepoContext } from "@/lib/server-auth";

/**
 * PATCH /api/tasks/[issueNumber]
 * Closes a task (GitHub issue).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ issueNumber: string }> }
  ) {
  try {
    assertTrustedOrigin(req);
    const authContext = await getGitHubAuthContext(req);
    if (!authContext.accessToken || !authContext.login) {
      throw new UnauthorizedError();
    }
    await enforceMutationRateLimit(req, {
      bucket: "tasks-complete",
      login: authContext.login,
      limit: 60,
      window: "10 m",
    });
    const { accessToken, login, owner, repo } = await requireHomeRepoContext(req, {
      getAuthContext: async () => authContext,
    });
    const { issueNumber: issueNumberStr } = await params;
    const issueNumber = parseInt(issueNumberStr, 10);
    if (isNaN(issueNumber) || issueNumber <= 0) {
      throw new ApiError("Invalid issue number.", 400);
    }

    const task = await completeTask(accessToken, owner, repo, issueNumber);
    let warning: string | undefined;

    try {
      await updateMemberStats(accessToken, owner, repo, login, 50);
    } catch (statsError) {
      console.error("[task-stats-update]", statsError);
      warning = "Task completed, but leaderboard stats could not be updated yet.";
    }

    return NextResponse.json({ task, warning });
  } catch (error) {
    return createApiErrorResponse(error);
  }
}
