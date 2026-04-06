import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { UnauthorizedError, createApiErrorResponse } from "@/lib/api-errors";
import { canAssignTask } from "@/lib/github-policy";
import { updateTaskAssignees } from "@/lib/github";
import { enforceMutationRateLimit } from "@/lib/server-rate-limit";
import { assertTrustedOrigin, getGitHubAuthContext, requireHomeRepoContext } from "@/lib/server-auth";

const updateTaskAssigneeSchema = z.object({
  assignee: z
    .string()
    .trim()
    .max(39)
    .regex(/^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$/, "Enter a valid GitHub username.")
    .nullable(),
});

type RouteContext = {
  params: Promise<{
    issueNumber: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    assertTrustedOrigin(req);
    const authContext = await getGitHubAuthContext(req);
    if (!authContext.accessToken || !authContext.login) {
      throw new UnauthorizedError();
    }
    await enforceMutationRateLimit(req, {
      bucket: "tasks-assign",
      login: authContext.login,
      limit: 60,
      window: "10 m",
    });
    const body = updateTaskAssigneeSchema.parse(await req.json());
    const { accessToken, owner, repo, homeRepo } = await requireHomeRepoContext(req, {
      getAuthContext: async () => authContext,
    });
    const { issueNumber: issueNumberParam } = await context.params;

    if (!/^\d+$/.test(issueNumberParam)) {
      return NextResponse.json({ error: "Invalid task number." }, { status: 400 });
    }

    const issueNumber = Number.parseInt(issueNumberParam, 10);

    if (
      !canAssignTask({
        actorLogin: authContext.login,
        actorPermission: homeRepo.viewer.permission,
        assignee: body.assignee,
      })
    ) {
      return NextResponse.json(
        { error: "Only repository managers can assign tasks to other family members." },
        { status: 403 }
      );
    }

    const task = await updateTaskAssignees(accessToken, owner, repo, issueNumber, body.assignee);

    return NextResponse.json({ task });
  } catch (error) {
    return createApiErrorResponse(error);
  }
}
