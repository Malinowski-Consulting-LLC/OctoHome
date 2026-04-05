import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api-errors";
import { getOctokit } from "@/lib/github";
import { requireGitHubAccessToken } from "@/lib/server-auth";

const repoQuerySchema = z.object({
  owner: z.string().min(1, "owner is required"),
  repo: z.string().min(1, "repo is required"),
});

/**
 * GET /api/board?owner=&repo=
 * Returns all issues (open + closed, no PRs) for kanban board rendering.
 * Paginates exhaustively until every page has been retrieved.
 */
export async function GET(req: NextRequest) {
  try {
    const accessToken = await requireGitHubAccessToken(req);

    const { searchParams } = new URL(req.url);
    const { owner, repo } = repoQuerySchema.parse({
      owner: searchParams.get("owner") ?? "",
      repo: searchParams.get("repo") ?? "",
    });

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
