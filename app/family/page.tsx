"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { AlertCircle, Flame, Loader2, Trophy, UserPlus, Users } from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import RepoRequiredState from "@/components/repo-required-state";
import Sidebar from "@/components/sidebar";
import { SurfaceCard } from "@/components/surface-card";
import { Input } from "@/components/ui/input";
import type { FamilyInviteResult, FamilyMember } from "@/lib/types";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";

const eyebrowClassName =
  "inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground";

const inviteFieldClassName =
  "h-12 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-4 text-base font-medium text-foreground placeholder:text-muted-foreground";

const inviteButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-transparent bg-[color:var(--accent-solid)] px-4 py-2.5 text-sm font-medium text-[color:var(--app-bg)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

type FamilyResponse = {
  members?: FamilyMember[];
  error?: string;
};

type InviteNotice = {
  tone: "success" | "info" | "error";
  message: string;
};

export default function FamilyPage() {
  const {
    status,
    error: repoError,
    refresh,
    repoOwner,
    repoName,
    viewer: resolvedViewer,
  } = useResolvedHomeRepo();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteNotice, setInviteNotice] = useState<InviteNotice | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const viewer = resolvedViewer ?? null;

  const loadFamily = useCallback(async () => {
    if (!repoOwner || !repoName) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/family", {
        headers: { "x-octohome-repo-owner": repoOwner },
      });
      const json = (await res.json()) as FamilyResponse;

      if (!res.ok) {
        if (res.status === 403) {
          setMembers([]);
          return;
        }
        throw new Error(json.error ?? "Failed to fetch family data");
      }

      setMembers(json.members ?? []);
    } catch (err) {
      setError((err as Error).message);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [repoName, repoOwner]);

  useEffect(() => {
    if (status !== "ready" || !repoOwner || !repoName) return;
    void loadFamily();
  }, [loadFamily, repoName, repoOwner, status]);

  if (status !== "ready") {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-5xl">
            <RepoRequiredState status={status} error={repoError} onRetry={refresh} />
          </div>
        </main>
      </div>
    );
  }

  const sortedMembers = [...members].sort((left, right) => right.points - left.points);
  const totalPoints = members.reduce((sum, member) => sum + member.points, 0);
  const longestStreak = members.reduce((max, member) => Math.max(max, member.streak), 0);

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!repoOwner || !repoName || !inviteUsername.trim()) {
      return;
    }

    setIsInviting(true);
    setInviteNotice(null);

    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-octohome-repo-owner": repoOwner,
        },
        body: JSON.stringify({ username: inviteUsername.trim() }),
      });
      const json = (await res.json()) as {
        result?: FamilyInviteResult;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error ?? json.result?.message ?? "Could not invite that family member.");
      }

      if (!json.result) {
        throw new Error("Could not invite that family member.");
      }

      setInviteNotice({
        tone: json.result.status === "already_has_access" ? "info" : "success",
        message: json.result.message,
      });
      setInviteUsername("");
      await loadFamily();
    } catch (err) {
      setInviteNotice({
        tone: "error",
        message: (err as Error).message,
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="space-y-3">
            <span className={eyebrowClassName}>
              <Users className="h-3.5 w-3.5" />
              Family
            </span>
            <PageHeader
              title="Family leaderboard"
              subtitle="Celebrate progress across the house with a calmer snapshot of points, streaks, and standings."
              actions={
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-2 text-sm font-medium text-muted-foreground">
                  {loading ? "Loading…" : `${members.length} members`}
                </span>
              }
            />
          </div>

          {!loading && !error && members.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                label="Household members"
                value={members.length}
                icon={<Users className="h-5 w-5 text-muted-foreground" />}
              />
              <MetricCard
                label="Total points"
                value={totalPoints}
                icon={<Trophy className="h-5 w-5 text-muted-foreground" />}
              />
              <MetricCard
                label="Longest streak"
                value={longestStreak}
                icon={<Flame className="h-5 w-5 text-muted-foreground" />}
              />
            </div>
          ) : null}

          {error ? (
            <SurfaceCard>
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Could not load family details</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p>
                </div>
              </div>
            </SurfaceCard>
          ) : loading ? (
            <SurfaceCard>
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <div>
                  <p className="text-base font-semibold text-foreground">Gathering the family…</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Refreshing points and streaks from your household repository.
                  </p>
                </div>
              </div>
            </SurfaceCard>
          ) : !viewer?.canManageFamily ? (
            <SurfaceCard tone="subtle">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Household visibility
                </div>
                <h2 className="text-lg font-semibold text-foreground">Family details are visible to managers</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  GitHub repo admins and maintainers can review the live household roster, points, and streaks.
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {viewer ? `Your access level: ${viewer.permission}` : "Checking your access level…"}
                </p>
              </div>
            </SurfaceCard>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <SurfaceCard className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    Rankings
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">Who is carrying the home forward</h2>
                </div>

                {sortedMembers.length ? (
                  <div className="space-y-3">
                    {sortedMembers.map((member, index) => (
                      <div
                        key={member.login}
                        className="flex flex-col gap-3 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] text-sm font-semibold text-foreground">
                            {index + 1}
                          </div>

                          <img
                            src={member.avatar_url}
                            className="h-14 w-14 shrink-0 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] object-cover"
                            alt={member.login}
                          />

                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-foreground">
                              {member.login}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">House member</p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-lg font-semibold text-foreground">{member.points}</p>
                          <p className="text-sm text-muted-foreground">points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">
                    No members were found for this household yet.
                  </p>
                )}
              </SurfaceCard>

              <SurfaceCard className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Flame className="h-4 w-4" />
                    Streaks
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">Current momentum</h2>
                </div>

                {members.length ? (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.login} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-medium text-foreground">{member.login}</p>
                          <p className="shrink-0 text-sm text-muted-foreground">
                            {member.streak > 0
                              ? `${member.streak} day${member.streak === 1 ? "" : "s"}`
                              : "No streak"}
                          </p>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-[color:var(--surface-2)]">
                          <div
                            className="h-full rounded-full bg-[color:var(--accent-solid)]"
                            style={{ width: `${Math.min(100, member.streak * 12)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">
                    No streak data is available yet.
                  </p>
                )}
              </SurfaceCard>
            </div>
          )}

          <SurfaceCard className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <UserPlus className="h-4 w-4" />
                  Household access
                </div>
                <h2 className="mt-2 text-lg font-semibold text-foreground">Invite a family member</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {viewer?.canManageFamily ? "Manager access" : "Limited access"}
              </span>
            </div>

            {viewer?.canManageFamily ? (
              <form
                onSubmit={(event) => {
                  void handleInvite(event);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label htmlFor="invite-username" className="text-sm font-medium text-foreground">
                    GitHub username
                  </label>
                  <Input
                    id="invite-username"
                    name="username"
                    value={inviteUsername}
                    onChange={(event) => setInviteUsername(event.target.value)}
                    placeholder="e.g. octocat"
                    className={inviteFieldClassName}
                  />
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  Invite a GitHub username to join your household after onboarding finishes.
                </p>

                {inviteNotice ? (
                  <div className="rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-4 py-3">
                    <p
                      className={`text-sm font-medium ${
                        inviteNotice.tone === "error" ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {inviteNotice.message}
                    </p>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isInviting || !inviteUsername.trim()}
                  className={inviteButtonClassName}
                >
                  {isInviting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Invite to household
                </button>
              </form>
            ) : (
              <div className="rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  Only household managers can invite new members.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  GitHub repo admins and maintainers can manage family membership for this household.
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {viewer ? `Your access level: ${viewer.permission}` : "Checking your access level…"}
                </p>
              </div>
            )}
          </SurfaceCard>
        </div>
      </main>
    </div>
  );
}
