import assert from "node:assert/strict";
import test from "node:test";

import { applyMemberActivity } from "./member-stats.ts";

test("starts a new streak when a member completes their first task", () => {
  const updated = applyMemberActivity(undefined, 50, new Date("2025-01-10T12:00:00.000Z"));

  assert.deepEqual(updated, {
    points: 50,
    streak: 1,
    lastActivity: "2025-01-10T12:00:00.000Z",
  });
});

test("keeps the same streak when multiple tasks are completed on the same day", () => {
  const updated = applyMemberActivity(
    {
      points: 50,
      streak: 1,
      lastActivity: "2025-01-10T08:00:00.000Z",
    },
    50,
    new Date("2025-01-10T18:00:00.000Z")
  );

  assert.deepEqual(updated, {
    points: 100,
    streak: 1,
    lastActivity: "2025-01-10T18:00:00.000Z",
  });
});

test("extends the streak when the member completes a task the next day", () => {
  const updated = applyMemberActivity(
    {
      points: 100,
      streak: 2,
      lastActivity: "2025-01-10T18:00:00.000Z",
    },
    50,
    new Date("2025-01-11T09:00:00.000Z")
  );

  assert.deepEqual(updated, {
    points: 150,
    streak: 3,
    lastActivity: "2025-01-11T09:00:00.000Z",
  });
});

test("resets the streak after a missed day", () => {
  const updated = applyMemberActivity(
    {
      points: 150,
      streak: 3,
      lastActivity: "2025-01-10T18:00:00.000Z",
    },
    50,
    new Date("2025-01-13T09:00:00.000Z")
  );

  assert.deepEqual(updated, {
    points: 200,
    streak: 1,
    lastActivity: "2025-01-13T09:00:00.000Z",
  });
});
