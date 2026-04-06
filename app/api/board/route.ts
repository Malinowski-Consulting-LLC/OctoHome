import { NextRequest, NextResponse } from "next/server";

import { createApiErrorResponse } from "@/lib/api-errors";
import { getOctokit } from "@/lib/github";
import { requireHomeRepoContext } from "@/lib/server-auth";

/**
 * GET /api/board
 * Returns all issues (open + closed, no PRs) for kanban board rendering.
 * Paginates exhaustively until every page has been retrieved.
 */
export async function GET(req: NextRequest) {
  try {
    const { accessToken, owner, repo } = await requireHomeRepoContext(req);
    const octokit = getOctokit(accessToken);

    const allIssues = await octokit.paginate(octokit.issues.listForRepo, {
      owner,
      repo,
      state: "all",
      per_page: 100,
    });

    const tasks = allIssues.filter((i) => !i.pull_request);
    return NextResponse.json({ tasks });
  } catch (error) {
    return createApiErrorResponse(error);
  }
}
