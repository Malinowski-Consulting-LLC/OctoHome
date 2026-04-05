import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, UnauthorizedError, createApiErrorResponse } from "@/lib/api-errors";
import { completeTask, updateMemberStats } from "@/lib/github";
import { getGitHubAuthContext } from "@/lib/server-auth";

const patchBodySchema = z.object({
  owner: z.string().trim().min(1),
  repo: z.string().trim().min(1),
});

/**
 * PATCH /api/tasks/[issueNumber]
 * Closes a task (GitHub issue).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ issueNumber: string }> }
) {
  try {
    const { accessToken, login } = await getGitHubAuthContext(req);
    if (!accessToken || !login) {
      throw new UnauthorizedError();
    }

    const { issueNumber: issueNumberStr } = await params;
    const issueNumber = parseInt(issueNumberStr, 10);
    if (isNaN(issueNumber) || issueNumber <= 0) {
      throw new ApiError("Invalid issue number.", 400);
    }

    const body = patchBodySchema.parse(await req.json());
    const task = await completeTask(accessToken, body.owner, body.repo, issueNumber);
    let warning: string | undefined;

    try {
      await updateMemberStats(accessToken, body.owner, body.repo, login, 50);
    } catch (statsError) {
      console.error("[task-stats-update]", statsError);
      warning = "Task completed, but leaderboard stats could not be updated yet.";
    }

    return NextResponse.json({ task, warning });
  } catch (error) {
    return createApiErrorResponse(error);
  }
}
