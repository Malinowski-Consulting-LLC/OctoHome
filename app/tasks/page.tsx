"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle,
  ListTodo,
  Loader2,
  Plus,
} from "lucide-react";

import { MagicalCelebration } from "@/components/magic/magical-celebration";
import { PageHeader } from "@/components/page-header";
import RepoRequiredState from "@/components/repo-required-state";
import Sidebar from "@/components/sidebar";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";
import type { IssueTask } from "@/lib/types";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";
import { useAppearanceStore } from "@/store/use-appearance-store";

const eyebrowClassName =
  "inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground";

const actionLinkClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-[color:var(--interactive-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-color)] sm:w-auto";

const quietButtonClassName =
  "h-10 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 text-sm font-medium normal-case tracking-normal text-foreground shadow-none hover:bg-[color:var(--interactive-hover)]";

const labelChipClassName =
  "rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground";

export default function TasksPage() {
  const { magicEnabled } = useAppearanceStore();
  const { status, error: repoError, refresh, repoOwner, repoName } = useResolvedHomeRepo();
  const [tasks, setTasks] = useState<IssueTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (status !== "ready" || !repoOwner || !repoName) return;

    async function load() {
      setLoading(true);
      setError(null);
      setNotice(null);
      try {
        const res = await fetch(
          `/api/tasks?owner=${encodeURIComponent(repoOwner)}&repo=${encodeURIComponent(repoName)}`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to fetch tasks");
        setTasks(json.tasks as IssueTask[]);
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

  const handleComplete = async (num: number) => {
    if (!repoOwner || !repoName) return;

    const snapshot = tasks;
    setTasks((prev) => prev.filter((task) => task.number !== num));
    try {
      const res = await fetch(`/api/tasks/${num}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: repoOwner, repo: repoName }),
      });
      const json = await res.json();
      if (!res.ok) {
        setTasks(snapshot);
        setError(json.error ?? "Failed to complete task");
        return;
      }
      setNotice(json.warning ?? null);
      if (magicEnabled) {
        setShowCelebration(true);
      }
    } catch {
      setTasks(snapshot);
      setError("Failed to complete task. Please try again.");
    }
  };

  const filteredTasks =
    filter === "All"
      ? tasks
      : tasks.filter((task) => task.labels.some((label) => label.name === filter));

  const uniqueLabels = [
    "All",
    ...Array.from(new Set(tasks.flatMap((task) => task.labels.map((label) => label.name)))),
  ];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background text-foreground [transform:translateZ(0)]">
      <MagicalCelebration active={magicEnabled && showCelebration} onComplete={() => setShowCelebration(false)} />
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="space-y-3">
            <span className={eyebrowClassName}>
              <ListTodo className="h-3.5 w-3.5" />
              Tasks
            </span>
            <PageHeader
              title="Household tasks"
              subtitle="Keep every current chore in view and close work out as soon as it is done."
              actions={
                <>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-2 text-sm font-medium text-muted-foreground">
                    {loading ? "Loading…" : `${tasks.length} open`}
                  </span>
                  <Link href="/tasks/new" className={actionLinkClassName}>
                    <Plus className="h-4 w-4" />
                    New task
                  </Link>
                </>
              }
            />
          </div>

          <SurfaceCard tone="subtle" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Filter by label</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Show every task or narrow the list to a single household category.
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-3 py-2 text-sm font-medium text-muted-foreground">
                {filteredTasks.length} visible
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {uniqueLabels.map((label) => {
                const isSelected = filter === label;

                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setFilter(label)}
                      className={`max-w-full rounded-full border px-3 py-2 text-left text-sm font-medium whitespace-normal break-words transition-colors ${
                        isSelected
                          ? "border-[color:var(--ring-color)] bg-[color:var(--interactive-hover)] text-foreground shadow-[var(--shadow-card)]"
                          : "border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] text-muted-foreground hover:bg-[color:var(--interactive-hover)] hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </SurfaceCard>

          {notice ? (
            <SurfaceCard tone="accent" className="border-[color:var(--border-strong)]">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                <p className="text-sm leading-6 text-foreground">{notice}</p>
              </div>
            </SurfaceCard>
          ) : null}

          {error ? (
            <SurfaceCard>
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Could not load tasks</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p>
                </div>
              </div>
            </SurfaceCard>
          ) : loading ? (
            <SurfaceCard>
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <div>
                  <p className="text-base font-semibold text-foreground">Loading tasks…</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Fetching the current task list from GitHub.
                  </p>
                </div>
              </div>
            </SurfaceCard>
          ) : filteredTasks.length === 0 ? (
            <SurfaceCard tone="subtle">
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <CheckCircle className="h-10 w-10 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Nothing left in this view</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {filter === "All"
                      ? "You are all caught up for now."
                      : `No tasks currently use the ${filter} label.`}
                  </p>
                </div>
              </div>
            </SurfaceCard>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const taskLabels =
                  task.labels.length > 0 ? task.labels : [{ name: "Household" }];

                return (
                  <SurfaceCard key={task.number} tone="subtle" className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          {taskLabels.map((label) => (
                            <span key={label.name} className={labelChipClassName}>
                              {label.name}
                            </span>
                          ))}
                        </div>

                        <h2 className="mt-3 text-base font-semibold leading-snug text-foreground">
                          {task.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          #{task.number} • Opened by {task.user?.login ?? "unknown"}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`${quietButtonClassName} w-full sm:w-auto`}
                        onClick={() => handleComplete(task.number)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Complete
                      </Button>
                    </div>
                  </SurfaceCard>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
