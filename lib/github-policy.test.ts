import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFamilyInviteResult,
  buildHomeViewer,
  canAssignTask,
  canCompleteTask,
  canCreateTask,
  canManageHousehold,
  getInvitePermission,
  parseRepoStats,
  resolveTaskCompletionCreditLogin,
  resolveRepoPermission,
  selectHomeRepoCandidate,
} from "./github-policy.ts";

test("getInvitePermission preserves push access for personal repositories", () => {
  assert.equal(getInvitePermission(false), "push");
});

test("getInvitePermission uses triage for organization repositories", () => {
  assert.equal(getInvitePermission(true), "triage");
});

test("buildHomeViewer grants management powers to admin users", () => {
  assert.deepEqual(buildHomeViewer("octocat", "admin"), {
    login: "octocat",
    permission: "admin",
    canManageFamily: true,
    canAssignOthers: true,
  });
});

test("buildHomeViewer does not grant management powers to triage users", () => {
  assert.deepEqual(buildHomeViewer("octocat", "triage"), {
    login: "octocat",
    permission: "triage",
    canManageFamily: false,
    canAssignOthers: false,
  });
});

test("canManageHousehold allows maintain access", () => {
  assert.equal(canManageHousehold("maintain"), true);
});

test("canManageHousehold rejects write access", () => {
  assert.equal(canManageHousehold("write"), false);
});

test("resolveRepoPermission prefers GitHub role_name when available", () => {
  assert.equal(
    resolveRepoPermission({
      role_name: "maintain",
      permissions: {
        admin: false,
        maintain: true,
        push: true,
        triage: true,
        pull: true,
      },
    }),
    "maintain"
  );
});

test("resolveRepoPermission falls back to boolean permission flags", () => {
  assert.equal(
    resolveRepoPermission({
      permissions: {
        admin: false,
        maintain: false,
        push: false,
        triage: false,
        pull: true,
      },
    }),
    "read"
  );
});

test("canAssignTask lets any user assign a task to themselves", () => {
  assert.equal(
    canAssignTask({
      actorLogin: "octocat",
      actorPermission: "triage",
      assignee: "OCTOCAT",
    }),
    true
  );
});

test("canAssignTask blocks a triage user from assigning someone else", () => {
  assert.equal(
    canAssignTask({
      actorLogin: "octocat",
      actorPermission: "triage",
      assignee: "hubot",
    }),
    false
  );
});

test("canAssignTask allows managers to clear an assignee", () => {
  assert.equal(
    canAssignTask({
      actorLogin: "octocat",
      actorPermission: "admin",
      assignee: null,
    }),
    true
  );
});

test("canAssignTask blocks non-managers from clearing an assignee", () => {
  assert.equal(
    canAssignTask({
      actorLogin: "octocat",
      actorPermission: "triage",
      assignee: null,
    }),
    false
  );
});

test("canCreateTask allows non-managers to leave a new task unassigned", () => {
  assert.equal(
    canCreateTask({
      actorLogin: "octocat",
      actorPermission: "triage",
      assignee: null,
    }),
    true
  );
});

test("canCreateTask blocks non-managers from assigning a new task to someone else", () => {
  assert.equal(
    canCreateTask({
      actorLogin: "octocat",
      actorPermission: "triage",
      assignee: "hubot",
    }),
    false
  );
});

test("canCompleteTask lets non-managers complete unassigned tasks", () => {
  assert.equal(
    canCompleteTask({
      actorLogin: "octocat",
      actorPermission: "triage",
      assignees: [],
    }),
    true
  );
});

test("canCompleteTask lets assignees complete their own assigned tasks", () => {
  assert.equal(
    canCompleteTask({
      actorLogin: "octocat",
      actorPermission: "triage",
      assignees: ["hubot", "OCTOCAT"],
    }),
    true
  );
});

test("canCompleteTask blocks non-managers from completing someone else's assigned task", () => {
  assert.equal(
    canCompleteTask({
      actorLogin: "octocat",
      actorPermission: "triage",
      assignees: ["hubot"],
    }),
    false
  );
});

test("canCompleteTask allows managers to complete any assigned task", () => {
  assert.equal(
    canCompleteTask({
      actorLogin: "octocat",
      actorPermission: "maintain",
      assignees: ["hubot"],
    }),
    true
  );
});

test("resolveTaskCompletionCreditLogin credits the actor when a task is unassigned", () => {
  assert.equal(
    resolveTaskCompletionCreditLogin({
      actorLogin: "octocat",
      assignees: [],
    }),
    "octocat"
  );
});

test("resolveTaskCompletionCreditLogin credits the matching assignee when present", () => {
  assert.equal(
    resolveTaskCompletionCreditLogin({
      actorLogin: "octocat",
      assignees: ["hubot", "OCTOCAT"],
    }),
    "OCTOCAT"
  );
});

test("resolveTaskCompletionCreditLogin falls back to the first assignee for manager-assisted completion", () => {
  assert.equal(
    resolveTaskCompletionCreditLogin({
      actorLogin: "octocat",
      assignees: ["hubot", "teammate"],
    }),
    "hubot"
  );
});

test("buildFamilyInviteResult separates existing access from a new invitation", () => {
  assert.deepEqual(buildFamilyInviteResult("octomom", { status: 204 }), {
    username: "octomom",
    success: true,
    status: "already_has_access",
    message: "octomom already has access to this household repository.",
  });
});

test("buildFamilyInviteResult preserves GitHub failures", () => {
  assert.deepEqual(buildFamilyInviteResult("octodad", { errorMessage: "Not Found" }), {
    username: "octodad",
    success: false,
    status: "failed",
    message: "Could not invite that GitHub user. Check the username and try again.",
  });
});

test("parseRepoStats accepts valid household stats content", () => {
  assert.deepEqual(
    parseRepoStats(
      JSON.stringify({
        household: "OctoHome",
        members: {
          alice: {
            points: 42,
            streak: 7,
            lastActivity: null,
          },
        },
        createdAt: "2026-04-05T12:00:00.000Z",
      })
    ),
    {
      household: "OctoHome",
      members: {
        alice: {
          points: 42,
          streak: 7,
          lastActivity: null,
        },
      },
      createdAt: "2026-04-05T12:00:00.000Z",
    }
  );
});

test("parseRepoStats rejects malformed member data", () => {
  assert.throws(
    () =>
      parseRepoStats(
        JSON.stringify({
          members: {
            alice: {
              points: "42",
              streak: 7,
              lastActivity: null,
            },
          },
        })
      ),
    /stats\.json contains invalid household data/
  );
});

test("selectHomeRepoCandidate prefers the explicit owner hint", () => {
  const candidate = selectHomeRepoCandidate(
    [
      {
        owner: "octocat",
        name: "home-ops",
        updatedAt: "2026-04-01T12:00:00.000Z",
        isPrivate: true,
      },
      {
        owner: "octo-org",
        name: "home-ops",
        updatedAt: "2026-04-05T12:00:00.000Z",
        isPrivate: true,
      },
    ],
    "octo-org"
  );

  assert.deepEqual(candidate, {
    owner: "octo-org",
    name: "home-ops",
    updatedAt: "2026-04-05T12:00:00.000Z",
    isPrivate: true,
  });
});

test("selectHomeRepoCandidate rejects a missing explicit owner hint", () => {
  assert.equal(
    selectHomeRepoCandidate(
      [
        {
          owner: "octocat",
          name: "home-ops",
          updatedAt: "2026-04-01T12:00:00.000Z",
          isPrivate: true,
        },
      ],
      "octo-org"
    ),
    null
  );
});

test("selectHomeRepoCandidate falls back to the most recently updated accessible home repo", () => {
  const candidate = selectHomeRepoCandidate([
    {
      owner: "octocat",
      name: "home-ops",
      updatedAt: "2026-04-01T12:00:00.000Z",
      isPrivate: true,
    },
    {
      owner: "octo-org",
      name: "home-ops",
      updatedAt: "2026-04-05T12:00:00.000Z",
      isPrivate: true,
    },
    {
      owner: "octocat",
      name: "other-repo",
      updatedAt: "2026-04-06T12:00:00.000Z",
      isPrivate: true,
    },
  ]);

  assert.deepEqual(candidate, {
    owner: "octo-org",
    name: "home-ops",
    updatedAt: "2026-04-05T12:00:00.000Z",
    isPrivate: true,
  });
});
