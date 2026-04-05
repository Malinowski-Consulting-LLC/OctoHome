import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createApiErrorResponse } from "@/lib/api-errors";
import { fetchTasks, createTask } from "@/lib/github";
import { requireGitHubAccessToken } from "@/lib/server-auth";

const repoQuerySchema = z.object({
  owner: z.string().min(1, "owner is required"),
  repo: z.string().min(1, "repo is required"),
});

const createTaskBodySchema = z.object({
  owner: z.string().trim().min(1),
  repo: z.string().trim().min(1),
  title: z.string().trim().min(1),
  body: z.string().default("Created via OctoHome"),
  labels: z.array(z.string()).default([]),
});

/**
 * GET /api/tasks?owner=&repo=
 * Returns open issues (tasks) for the given repo.
 */
export async function GET(req: NextRequest) {
  try {
    const accessToken = await requireGitHubAccessToken(req);

    const { searchParams } = new URL(req.url);
    const { owner, repo } = repoQuerySchema.parse({
      owner: searchParams.get("owner") ?? "",
      repo: searchParams.get("repo") ?? "",
    });

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
    const accessToken = await requireGitHubAccessToken(req);

    const body = createTaskBodySchema.parse(await req.json());
    const task = await createTask(
      accessToken,
      body.owner,
      body.repo,
      body.title,
      body.body,
      body.labels
    );

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return createApiErrorResponse(error);
  }
}
