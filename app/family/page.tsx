"use client";

import { useEffect, useState } from "react";

import { AlertCircle, Flame, Loader2, Trophy, Users } from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import RepoRequiredState from "@/components/repo-required-state";
import Sidebar from "@/components/sidebar";
import { SurfaceCard } from "@/components/surface-card";
import type { FamilyMember } from "@/lib/types";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";

const eyebrowClassName =
  "inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground";

export default function FamilyPage() {
  const { status, error: repoError, refresh, repoOwner, repoName } = useResolvedHomeRepo();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "ready" || !repoOwner || !repoName) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/family?owner=${encodeURIComponent(repoOwner)}&repo=${encodeURIComponent(repoName)}`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to fetch family data");
        setMembers(json.members as FamilyMember[]);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [repoName, repoOwner, status]);

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

          {!loading && !error ? (
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
                  <h2 className="text-lg font-semibold text-foreground">Could not load family stats</h2>
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
        </div>
      </main>
    </div>
  );
}
