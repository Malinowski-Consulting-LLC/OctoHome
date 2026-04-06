import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ApiError, UnauthorizedError, createApiErrorResponse } from "@/lib/api-errors";
import { commitFile } from "@/lib/github";
import { enforceMutationRateLimit } from "@/lib/server-rate-limit";
import { assertTrustedOrigin, getGitHubAuthContext, requireHomeRepoContext } from "@/lib/server-auth";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const CRON_DAYS = ["1", "2", "3", "4", "5", "6", "0"] as const; // GitHub crons: 0-6 is Sun-Sat

/**
 * Converts a freeform title to a filesystem-safe slug.
 * Only lowercase letters, digits, and hyphens are allowed.
 * Consecutive separators are collapsed; leading/trailing hyphens are trimmed.
 */
function toSafeSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateWorkflowYaml(title: string, days: string[]): string {
  const cronDays = days
    .map((d) => CRON_DAYS[DAYS.indexOf(d as (typeof DAYS)[number])])
    .filter(Boolean)
    .join(",");
  const cron = `0 9 * * ${cronDays}`;

  // Use JSON.stringify so any quotes, newlines, or other special characters in
  // the title cannot break out of the JavaScript string literal.
  const safeJsTitle = JSON.stringify(title);
  // Use JSON.stringify for the YAML name field too — a double-quoted YAML
  // scalar is a superset of a JSON string, so this is always safe.
  const safeYamlName = JSON.stringify(`Routine - ${title}`);

  return `name: ${safeYamlName}
on:
  schedule:
    - cron: '${cron}'
  workflow_dispatch: # Allow manual trigger

jobs:
  create_issue:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - name: Create Household Issue
        uses: actions/github-script@ed597411d8f924073f98dfc5c65a23a2325f34cd
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: ${safeJsTitle},
              labels: ['Routine', 'Automated']
            })`;
}

const templateBodySchema = z.object({
  title: z.string().trim().min(1, "Routine title is required").max(200),
  days: z
    .array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))
    .min(1, "At least one day is required"),
});

/**
 * POST /api/templates
 * Generates and commits a GitHub Actions workflow file for a recurring
 * household routine. Accepts logical inputs (title + days); the server
 * derives a safe workflow path and generates the YAML content.
 */
export async function POST(req: NextRequest) {
  try {
    assertTrustedOrigin(req);
    const authContext = await getGitHubAuthContext(req);
    if (!authContext.accessToken || !authContext.login) {
      throw new UnauthorizedError();
    }
    await enforceMutationRateLimit(req, {
      bucket: "templates-create",
      login: authContext.login,
      limit: 10,
      window: "1 h",
    });
    const { accessToken, owner, repo } = await requireHomeRepoContext(req, {
      getAuthContext: async () => authContext,
    });
    const body = templateBodySchema.parse(await req.json());

    const slug = toSafeSlug(body.title);
    if (!slug) {
      throw new ApiError(
        "Routine title must contain at least one letter or number.",
        400
      );
    }

    const content = generateWorkflowYaml(body.title, body.days);
    const path = `.github/workflows/routine-${slug}.yml`;

    try {
      await commitFile(
        accessToken,
        owner,
        repo,
        path,
        content,
        `Add recurring routine: ${body.title}`
      );
    } catch (e) {
      // GitHub returns 422 when the file already exists and no SHA is supplied.
      if ((e as { status?: number })?.status === 422) {
        throw new ApiError(
          `A routine named "${body.title}" already exists. Choose a different name.`,
          409
        );
      }
      throw e;
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return createApiErrorResponse(error);
  }
}
