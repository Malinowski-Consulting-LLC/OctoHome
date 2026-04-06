import { z } from "zod";

import type { StoredMemberStats } from "./member-stats";

export type RepoStats = {
  household?: string;
  members: Record<string, StoredMemberStats | undefined>;
  createdAt?: string;
};

export type InvitePermission = "push" | "triage";
export type RepoPermission = "admin" | "maintain" | "write" | "triage" | "read" | "none";
export type RepoPermissionSource = {
  role_name?: string | null;
  permissions?: {
    admin?: boolean;
    maintain?: boolean;
    push?: boolean;
    triage?: boolean;
    pull?: boolean;
  } | null;
};

export type HomeViewer = {
  login: string;
  permission: RepoPermission;
  canManageFamily: boolean;
  canAssignOthers: boolean;
};

export type HomeRepoCandidate = {
  owner: string;
  name: string;
  updatedAt: string;
  isPrivate: boolean;
};

const storedMemberStatsSchema = z.object({
  points: z.number().finite(),
  streak: z.number().int().nonnegative(),
  lastActivity: z.string().min(1).nullable(),
});

const repoStatsSchema = z.object({
  household: z.string().optional(),
  members: z.record(z.string(), storedMemberStatsSchema),
  createdAt: z.string().optional(),
});

export function getInvitePermission(isOrg: boolean): InvitePermission {
  return isOrg ? "triage" : "push";
}

export function normalizeRepoPermission(permission?: string | null): RepoPermission {
  switch (permission) {
    case "admin":
    case "maintain":
    case "write":
    case "triage":
    case "read":
      return permission;
    default:
      return "none";
  }
}

export function canManageHousehold(permission: RepoPermission): boolean {
  return permission === "admin" || permission === "maintain";
}

export function resolveRepoPermission(source: RepoPermissionSource): RepoPermission {
  const normalizedRole = normalizeRepoPermission(source.role_name);
  if (normalizedRole !== "none") {
    return normalizedRole;
  }

  if (source.permissions?.admin) {
    return "admin";
  }

  if (source.permissions?.maintain) {
    return "maintain";
  }

  if (source.permissions?.push) {
    return "write";
  }

  if (source.permissions?.triage) {
    return "triage";
  }

  if (source.permissions?.pull) {
    return "read";
  }

  return "none";
}

export function buildHomeViewer(login: string, permission?: string | null): HomeViewer {
  const normalizedPermission = normalizeRepoPermission(permission);
  const canManage = canManageHousehold(normalizedPermission);

  return {
    login,
    permission: normalizedPermission,
    canManageFamily: canManage,
    canAssignOthers: canManage,
  };
}

export function canAssignTask(input: {
  actorLogin: string;
  actorPermission: RepoPermission;
  assignee: string | null;
}): boolean {
  if (canManageHousehold(input.actorPermission)) {
    return true;
  }

  if (!input.assignee) {
    return false;
  }

  return input.actorLogin.toLowerCase() === input.assignee.toLowerCase();
}

export function canCreateTask(input: {
  actorLogin: string;
  actorPermission: RepoPermission;
  assignee: string | null;
}): boolean {
  if (canManageHousehold(input.actorPermission)) {
    return true;
  }

  if (!input.assignee) {
    return true;
  }

  return input.actorLogin.toLowerCase() === input.assignee.toLowerCase();
}

export function canCompleteTask(input: {
  actorLogin: string;
  actorPermission: RepoPermission;
  assignees: string[];
}): boolean {
  if (canManageHousehold(input.actorPermission)) {
    return true;
  }

  if (input.assignees.length === 0) {
    return true;
  }

  const normalizedActor = input.actorLogin.toLowerCase();
  return input.assignees.some((assignee) => assignee.toLowerCase() === normalizedActor);
}

export function resolveTaskCompletionCreditLogin(input: {
  actorLogin: string;
  assignees: string[];
}): string {
  const normalizedActor = input.actorLogin.toLowerCase();
  const matchingAssignee = input.assignees.find(
    (assignee) => assignee.toLowerCase() === normalizedActor
  );

  return matchingAssignee ?? input.assignees[0] ?? input.actorLogin;
}

function sanitizeFamilyInviteFailure(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase();

  if (
    normalizedMessage.includes("not found") ||
    normalizedMessage.includes("could not resolve to a user")
  ) {
    return "Could not invite that GitHub user. Check the username and try again.";
  }

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("secondary rate") ||
    normalizedMessage.includes("abuse detection")
  ) {
    return "GitHub temporarily blocked the invitation. Please wait a moment and try again.";
  }

  return "GitHub could not complete that invitation right now. Please try again.";
}

export function buildFamilyInviteResult(
  username: string,
  input:
    | { status: 201 | 204 }
    | {
        errorMessage: string;
      }
) {
  if ("errorMessage" in input) {
    return {
      username,
      success: false,
      status: "failed" as const,
      message: sanitizeFamilyInviteFailure(input.errorMessage),
    };
  }

  return {
    username,
    success: true,
    status: input.status === 204 ? ("already_has_access" as const) : ("invited" as const),
    message:
      input.status === 204
        ? `${username} already has access to this household repository.`
        : `Invitation sent to ${username}.`,
  };
}

export function selectHomeRepoCandidate(
  candidates: HomeRepoCandidate[],
  preferredOwner?: string
): HomeRepoCandidate | null {
  const homeRepos = candidates.filter((candidate) => candidate.name === "home-ops");

  if (preferredOwner) {
    const normalizedOwner = preferredOwner.toLowerCase();
    return homeRepos.find((candidate) => candidate.owner.toLowerCase() === normalizedOwner) ?? null;
  }

  if (homeRepos.length === 0) {
    return null;
  }

  return [...homeRepos].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
  )[0]!;
}

export function parseRepoStats(content: string): RepoStats {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content) as unknown;
  } catch {
    throw new Error("stats.json is not valid JSON");
  }

  const result = repoStatsSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("stats.json contains invalid household data");
  }

  return result.data;
}
