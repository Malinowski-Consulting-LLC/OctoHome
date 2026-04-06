import assert from "node:assert/strict";
import test from "node:test";

import {
  getInvitePermission,
  parseRepoStats,
  selectHomeRepoCandidate,
} from "./github-policy.ts";

test("getInvitePermission preserves push access for personal repositories", () => {
  assert.equal(getInvitePermission(false), "push");
});

test("getInvitePermission uses triage for organization repositories", () => {
  assert.equal(getInvitePermission(true), "triage");
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
