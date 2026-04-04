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

export async function inviteToOrg(token: string, org: string, username: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.orgs.createInvitation({
    org,
    invitee_id: (await octokit.users.getByUsername({ username })).data.id,
  });
  return data;
}

export async function enablePages(token: string, owner: string, repo: string) {
  const octokit = getOctokit(token);
  // This is simplified; usually requires a branch/path
  const { data } = await octokit.repos.createPagesSite({
    owner,
    repo,
    source: {
      branch: "main",
      path: "/",
    },
  });
  return data;
}
