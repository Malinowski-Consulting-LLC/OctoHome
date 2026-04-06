import { z } from "zod";

import type { StoredMemberStats } from "./member-stats";

export type RepoStats = {
  household?: string;
  members: Record<string, StoredMemberStats | undefined>;
  createdAt?: string;
};

export type InvitePermission = "push" | "triage";

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
