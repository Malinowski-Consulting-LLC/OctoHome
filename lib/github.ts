import { Octokit } from "@octokit/rest";

export function getOctokit(token: string) {
  return new Octokit({ auth: token });
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
 */
export async function waitForRepo(token: string, owner: string, repo: string, maxRetries = 10) {
  const octokit = getOctokit(token);
  for (let i = 0; i < maxRetries; i++) {
    try {
      await octokit.repos.get({ owner, repo });
      return true;
    } catch {
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
    } catch {
      // Label might already exist, ignore
    }
  }
}

/**
 * Fetches all open tasks (issues).
 */
export async function fetchTasks(token: string, owner: string, repo: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: "open",
    per_page: 100,
  });
  return data.filter((issue) => !issue.pull_request);
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

export async function fetchStats(token: string, owner: string, repo: string) {
  const octokit = getOctokit(token);
  try {
    const { data }: any = await octokit.repos.getContent({
      owner,
      repo,
      path: "stats.json",
    });
    const content = Buffer.from(data.content, "base64").toString();
    const stats = JSON.parse(content);
    return { stats, sha: data.sha };
  } catch {
    // If it doesn't exist, return default
    return { stats: { members: {} } as any, sha: undefined };
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
  
  if (!stats.members[username]) {
    stats.members[username] = { points: 0, streak: 0, lastActivity: null };
  }
  
  stats.members[username].points += pointsDelta;
  stats.members[username].lastActivity = new Date().toISOString();

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
