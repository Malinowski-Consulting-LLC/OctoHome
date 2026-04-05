export type StoredMemberStats = {
  points: number;
  streak: number;
  lastActivity: string | null;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toUtcDayTimestamp(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function resolveNextStreak(existing: StoredMemberStats | undefined, now: Date) {
  if (!existing?.lastActivity) {
    return 1;
  }

  const lastActivity = new Date(existing.lastActivity);
  if (Number.isNaN(lastActivity.getTime())) {
    return 1;
  }

  const dayDelta = Math.round((toUtcDayTimestamp(now) - toUtcDayTimestamp(lastActivity)) / DAY_IN_MS);
  const currentStreak = Math.max(existing.streak, 1);

  if (dayDelta <= 0) {
    return currentStreak;
  }

  if (dayDelta === 1) {
    return currentStreak + 1;
  }

  return 1;
}

export function applyMemberActivity(
  existing: StoredMemberStats | undefined,
  pointsDelta: number,
  now = new Date()
): StoredMemberStats {
  return {
    points: (existing?.points ?? 0) + pointsDelta,
    streak: resolveNextStreak(existing, now),
    lastActivity: now.toISOString(),
  };
}
