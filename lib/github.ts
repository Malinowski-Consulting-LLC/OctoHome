import { Octokit } from "@octokit/rest";

import { applyMemberActivity, type StoredMemberStats } from "@/lib/member-stats";

export function getOctokit(token: string) {
  return new Octokit({ auth: token });
}

type RepoStats = {
  household?: string;
  members: Record<string, StoredMemberStats | undefined>;
  createdAt?: string;
};

/** Bootstrap data written to stats.json during onboarding. */
export type HomeBootstrap = {
  /** Household name set during onboarding. */
  household: string;
  /** Number of members recorded in stats at discovery time. */
  memberCount: number;
  /** ISO timestamp from the initial stats commit. */
  createdAt: string;
};

export type HomeRepoSummary = {
  owner: string;
  name: string;
  updatedAt: string;
  isPrivate: boolean;
  /** Populated from stats.json when the repo has been bootstrapped; null otherwise. */
  bootstrap: HomeBootstrap | null;
};

/** Returns true only for HTTP 404 responses from the GitHub API. */
function isNotFoundError(e: unknown): boolean {
  return (e as { status?: number })?.status === 404;
}

/** Returns true only for HTTP 403 responses (e.g. missing org scope). */
function isForbiddenError(e: unknown): boolean {
  return (e as { status?: number })?.status === 403;
}

/** Returns true for HTTP 422, the status GitHub uses when a label already exists. */
function isAlreadyExistsError(e: unknown): boolean {
  return (e as { status?: number })?.status === 422;
}

/**
 * Reads stats.json and extracts household bootstrap data.
 * Returns null when stats.json does not yet exist (fetchStats returns sha:
 * undefined). Any other error from fetchStats propagates — unexpected GitHub
 * failures or content errors should not be silently swallowed here.
 */
async function tryReadBootstrap(
  token: string,
  owner: string,
  repo: string
): Promise<HomeBootstrap | null> {
  const { stats, sha } = await fetchStats(token, owner, repo);
  if (!sha) return null; // stats.json has not been initialised yet
  return {
    household: typeof stats.household === "string" ? stats.household : "",
    memberCount:
      typeof stats.members === "object" && stats.members !== null
        ? Object.keys(stats.members as object).length
        : 0,
    createdAt: typeof stats.createdAt === "string" ? stats.createdAt : "",
  };
}

/**
 * Discovers the user's home-ops repository.
 * Checks the user's personal account first, then all orgs they belong to.
 * Returns null if no home-ops repo is accessible.
 *
 * Only expected "not found" (404) and "no org scope" (403) errors are
 * swallowed. All other failures (network errors, server errors, rate-limit
 * responses, etc.) are re-thrown so callers can handle them properly.
 */
export async function findHomeRepo(token: string, login: string): Promise<HomeRepoSummary | null> {
  const octokit = getOctokit(token);

  // Check personal account first
  try {
    const { data } = await octokit.repos.get({ owner: login, repo: "home-ops" });
    const bootstrap = await tryReadBootstrap(token, data.owner.login, data.name);
    return {
      owner: data.owner.login,
      name: data.name,
      updatedAt: data.updated_at,
      isPrivate: data.private,
      bootstrap,
    };
  } catch (e) {
    if (!isNotFoundError(e)) throw e;
    // 404 — repo absent from personal account; fall through to org check
  }

  // List orgs; a 403 here means the token lacks org-listing scope — that is
  // expected and we just skip the org scan rather than failing entirely.
  let orgs: Array<{ login: string }>;
  try {
    const { data } = await octokit.orgs.listForAuthenticatedUser();
    orgs = data;
  } catch (e) {
    if (!isForbiddenError(e)) throw e;
    // 403 — no org scope; skip org scan
    return null;
  }

  for (const org of orgs) {
    try {
      const { data } = await octokit.repos.get({ owner: org.login, repo: "home-ops" });
      const bootstrap = await tryReadBootstrap(token, data.owner.login, data.name);
      return {
        owner: data.owner.login,
        name: data.name,
        updatedAt: data.updated_at,
        isPrivate: data.private,
        bootstrap,
      };
    } catch (e) {
      if (!isNotFoundError(e)) throw e;
      // 404 — not in this org; continue scanning
    }
  }

  return null;
}

export async function getUserOrgs(token: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.orgs.listForAuthenticatedUser();
  return data;
}

export async function forkRepo(token: string, owner: string, repo: string, org?: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.repos.createFork({
    owner,
    repo,
    organization: org,
  });
  return data;
}

/**
 * Polls the GitHub API until a repository is available.
 * Retries only on 404 (propagation delay after creation); re-throws any other
 * error (auth failure, rate-limit, server error) immediately.
 */
export async function waitForRepo(token: string, owner: string, repo: string, maxRetries = 4) {
  const octokit = getOctokit(token);
  for (let i = 0; i < maxRetries; i++) {
    try {
      await octokit.repos.get({ owner, repo });
      return true;
    } catch (e) {
      if (!isNotFoundError(e)) throw e;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  return false;
}

export async function createRepo(token: string, name: string, org?: string) {
  const octokit = getOctokit(token);
  if (org) {
    const { data } = await octokit.repos.createInOrg({
      org,
      name,
      private: true,
    });
    return data;
  } else {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name,
      private: true,
    });
    return data;
  }
}

/**
 * Commits a file to the repository. Useful for Workflows or stats.json.
 */
export async function commitFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string
) {
  const octokit = getOctokit(token);
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString("base64"),
    sha,
  });
  return data;
}

/**
 * Invites a family member to the repository.
 */
export async function inviteFamilyMember(token: string, owner: string, repo: string, username: string) {
  const octokit = getOctokit(token);
  try {
    const { data } = await octokit.repos.addCollaborator({
      owner,
      repo,
      username,
      permission: "push",
    });
    return data;
  } catch (e) {
    console.error(`Failed to invite ${username}`, e);
    return null;
  }
}

/**
 * Initializes default household labels.
 * Swallows only HTTP 422 (label already exists); re-throws all other failures.
 */
export async function setupDefaultLabels(token: string, owner: string, repo: string) {
  const octokit = getOctokit(token);
  const labels = [
    { name: "Groceries", color: "dcfce7", description: "Food and kitchen supplies" },
    { name: "Bills", color: "ffedd5", description: "Utilities and financial tasks" },
    { name: "Maintenance", color: "dbeafe", description: "Home repairs and upkeep" },
    { name: "School", color: "f3f4f6", description: "Education and extracurriculars" },
    { name: "Health", color: "fee2e2", description: "Doctor visits and wellness" },
    { name: "Urgent", color: "000000", description: "High priority tasks" },
  ];

  for (const label of labels) {
    try {
      await octokit.issues.createLabel({
        owner,
        repo,
        ...label,
      });
    } catch (e) {
      if (!isAlreadyExistsError(e)) throw e;
      // 422 — label already exists; skip
    }
  }
}

/**
 * Fetches all open tasks (issues), paginating until every page is retrieved.
 */
export async function fetchTasks(token: string, owner: string, repo: string) {
  const octokit = getOctokit(token);
  const allIssues = await octokit.paginate(octokit.issues.listForRepo, {
    owner,
    repo,
    state: "open",
    per_page: 100,
  });
  return allIssues.filter((issue) => !issue.pull_request);
}

/**
 * Creates a new task.
 */
export async function createTask(
  token: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels: string[],
  assignees?: string[]
) {
  const octokit = getOctokit(token);
  const { data } = await octokit.issues.create({
    owner,
    repo,
    title,
    body,
    labels,
    assignees,
  });
  return data;
}

/**
 * Completes a task by closing the issue.
 */
export async function completeTask(token: string, owner: string, repo: string, issueNumber: number) {
  const octokit = getOctokit(token);
  const { data } = await octokit.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: "closed",
  });
  return data;
}

export async function fetchStats(
  token: string,
  owner: string,
  repo: string
): Promise<{ stats: RepoStats; sha: string | undefined }> {
  const octokit = getOctokit(token);
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: "stats.json",
    });
    // getContent can return a file, directory listing, symlink, or submodule.
    // Narrow to the file case before reading content/sha.
    if (Array.isArray(data) || data.type !== "file") {
      throw new Error("stats.json is not a file");
    }
    const content = Buffer.from(data.content, "base64").toString();
    const stats = JSON.parse(content) as RepoStats;
    return { stats, sha: data.sha };
  } catch (e) {
    if (!isNotFoundError(e)) throw e;
    // 404 — stats.json does not exist yet; return an empty default
    const emptyStats: RepoStats = { members: {} };
    return { stats: emptyStats, sha: undefined };
  }
}

export async function updateMemberStats(
  token: string,
  owner: string,
  repo: string,
  username: string,
  pointsDelta: number
) {
  const { stats, sha } = await fetchStats(token, owner, repo);
  stats.members[username] = applyMemberActivity(stats.members[username], pointsDelta);

  return await commitFile(
    token,
    owner,
    repo,
    "stats.json",
    JSON.stringify(stats, null, 2),
    `chore: update stats for ${username}`,
    sha
  );
}
