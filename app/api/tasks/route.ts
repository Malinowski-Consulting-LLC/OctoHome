import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { UnauthorizedError, createApiErrorResponse } from "@/lib/api-errors";
import { fetchTasks, createTask } from "@/lib/github";
import { enforceMutationRateLimit } from "@/lib/server-rate-limit";
import { assertTrustedOrigin, getGitHubAuthContext, requireHomeRepoContext } from "@/lib/server-auth";

const createTaskBodySchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().default("Created via OctoHome"),
  labels: z.array(z.string()).default([]),
});

/**
 * GET /api/tasks
 * Returns open issues (tasks) for the authenticated user's home repo.
 */
export async function GET(req: NextRequest) {
  try {
    const { accessToken, owner, repo } = await requireHomeRepoContext(req);
    const tasks = await fetchTasks(accessToken, owner, repo);
    return NextResponse.json({ tasks });
  } catch (error) {
    return createApiErrorResponse(error);
  }
}

/**
 * POST /api/tasks
 * Creates a new task (GitHub issue).
 */
export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const authContext = await getGitHubAuthContext(req);
    if (!authContext.accessToken || !authContext.login) {
      throw new UnauthorizedError();
    }
    await enforceMutationRateLimit(req, {
      bucket: "tasks-create",
      login: authContext.login,
      limit: 30,
      window: "10 m",
    });
    const { accessToken, owner, repo } = await requireHomeRepoContext(req, {
      getAuthContext: async () => authContext,
    });
    const body = createTaskBodySchema.parse(await req.json());
    const task = await createTask(
      accessToken,
      owner,
      repo,
      body.title,
      body.body,
      body.labels
    );

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return createApiErrorResponse(error);
  }
}
