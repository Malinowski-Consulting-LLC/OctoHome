"use client";

import { useEffect, useRef, useState } from "react";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KanbanSquare,
  Loader2,
} from "lucide-react";

import { BoardColumnShell } from "@/components/board-column-shell";
import { AnimatedBeam } from "@/components/magic/animated-beam";
import { MagicalCelebration } from "@/components/magic/magical-celebration";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import RepoRequiredState from "@/components/repo-required-state";
import Sidebar from "@/components/sidebar";
import { SurfaceCard } from "@/components/surface-card";
import { TaskAssignmentControl } from "@/components/task-assignment-control";
import { Button } from "@/components/ui/button";
import type { IssueTask } from "@/lib/types";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";
import { useAppearanceStore } from "@/store/use-appearance-store";

const COLUMNS = [
  { key: "Open", emptyLabel: "No open tasks right now." },
  { key: "Done", emptyLabel: "Nothing completed yet." },
] as const;

const eyebrowClassName =
  "inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground";

const quietButtonClassName =
  "h-10 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 text-sm font-medium normal-case tracking-normal text-foreground shadow-none hover:bg-[color:var(--interactive-hover)]";

const labelChipClassName =
  "rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground";

export default function BoardPage() {
  const { magicEnabled } = useAppearanceStore();
  const { status, error: repoError, refresh, repoOwner, repoName, viewer } = useResolvedHomeRepo();
  const [tasks, setTasks] = useState<IssueTask[]>([]);
  const [memberLogins, setMemberLogins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [assigningTaskNumber, setAssigningTaskNumber] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const doneMarkerRef = useRef<HTMLDivElement>(null);
  const sidebarTargetRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (status !== "ready" || !repoOwner || !repoName) return;

    async function load() {
      setLoading(true);
      setError(null);
      setNotice(null);
      try {
        const tasksPromise = fetch("/api/board", {
          headers: { "x-octohome-repo-owner": repoOwner },
        });
        const familyPromise =
          viewer?.canAssignOthers
            ? fetch("/api/family", {
                headers: { "x-octohome-repo-owner": repoOwner },
              })
            : null;

        const tasksRes = await tasksPromise;
        const tasksJson = await tasksRes.json();
        if (!tasksRes.ok) throw new Error(tasksJson.error ?? "Failed to fetch board");
        setTasks(tasksJson.tasks as IssueTask[]);

        if (familyPromise) {
          const familyRes = await familyPromise;
          const familyJson = await familyRes.json();
          if (familyRes.ok) {
            setMemberLogins(
              ((familyJson.members as Array<{ login: string }> | undefined) ?? []).map((member) => member.login)
            );
          } else {
            setMemberLogins([]);
          }
        } else {
          setMemberLogins([]);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [repoName, repoOwner, status, viewer?.canAssignOthers]);

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

  const handleMoveToDone = async (num: number) => {
    if (!repoOwner || !repoName) return;

    const snapshot = tasks;
    setTasks((prev) => prev.map((task) => (task.number === num ? { ...task, state: "closed" } : task)));

    try {
      const res = await fetch(`/api/tasks/${num}`, {
        method: "PATCH",
        headers: { "x-octohome-repo-owner": repoOwner },
      });
      const json = await res.json();
      if (!res.ok) {
        setTasks(snapshot);
        setError(json.error ?? "Failed to close task");
        return;
      }
      setNotice(json.warning ?? null);
      if (magicEnabled) {
        setShowCelebration(true);
      }
    } catch {
      setTasks(snapshot);
      setError("Failed to close task. Please try again.");
    }
  };

  const handleAssign = async (issueNumber: number, assignee: string | null) => {
    if (!repoOwner || !repoName) return;

    const snapshot = tasks;
    setAssigningTaskNumber(issueNumber);
    setError(null);
    setNotice(null);
    setTasks((prev) =>
      prev.map((task) =>
        task.number === issueNumber
          ? {
              ...task,
              assignees: assignee ? [{ login: assignee }] : [],
            }
          : task
      )
    );

    try {
      const res = await fetch(`/api/tasks/${issueNumber}/assignment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-octohome-repo-owner": repoOwner,
        },
        body: JSON.stringify({ assignee }),
      });
      const json = await res.json();
      if (!res.ok) {
        setTasks(snapshot);
        setError(json.error ?? "Failed to update task assignee");
        return;
      }
      setTasks((prev) =>
        prev.map((task) => (task.number === issueNumber ? (json.task as IssueTask) : task))
      );
      setNotice(
        assignee ? `Task #${issueNumber} is now assigned to ${assignee}.` : `Task #${issueNumber} is now unassigned.`
      );
    } catch {
      setTasks(snapshot);
      setError("Failed to update task assignee. Please try again.");
    } finally {
      setAssigningTaskNumber(null);
    }
  };

  const openTasks = tasks.filter((task) => task.state !== "closed");
  const doneTasks = tasks.filter((task) => task.state === "closed");
  const columns = [
    { ...COLUMNS[0], tasks: openTasks },
    { ...COLUMNS[1], tasks: doneTasks },
  ];

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen overflow-hidden bg-background text-foreground [transform:translateZ(0)]"
    >
      <MagicalCelebration active={magicEnabled && showCelebration} onComplete={() => setShowCelebration(false)} />
      {magicEnabled ? (
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={doneMarkerRef}
          toRef={sidebarTargetRef}
          curvature={-100}
          duration={3}
        />
      ) : null}

      <Sidebar familyRef={sidebarTargetRef} />

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="space-y-3">
            <span className={eyebrowClassName}>
              <KanbanSquare className="h-3.5 w-3.5" />
              Board
            </span>
            <PageHeader
              title="Family board"
              subtitle="Track open tasks and completed chores without losing sight of the household flow."
              actions={
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-2 text-sm font-medium text-muted-foreground">
                  {tasks.length} cards
                </span>
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              label="Open tasks"
              value={openTasks.length}
              icon={<KanbanSquare className="h-5 w-5 text-muted-foreground" />}
            />
            <MetricCard
              label="Completed tasks"
              value={doneTasks.length}
              icon={<CheckCircle2 className="h-5 w-5 text-muted-foreground" />}
            />
          </div>

          {notice ? (
            <SurfaceCard tone="accent" className="border-[color:var(--border-strong)]">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                <p className="text-sm leading-6 text-foreground">{notice}</p>
              </div>
            </SurfaceCard>
          ) : null}

          {error ? (
            <SurfaceCard>
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Could not load the board</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p>
                </div>
              </div>
            </SurfaceCard>
          ) : loading ? (
            <SurfaceCard>
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <div>
                  <p className="text-base font-semibold text-foreground">Organizing the board…</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pulling the latest household tasks from GitHub.
                  </p>
                </div>
              </div>
            </SurfaceCard>
          ) : (
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 lg:gap-6 lg:items-start">
              {columns.map((column) => (
                <div key={column.key} className="relative min-w-0">
                  {column.key === "Done" ? (
                    <div
                      ref={doneMarkerRef}
                      aria-hidden="true"
                      className="pointer-events-none absolute right-6 top-6 h-3 w-3 rounded-full opacity-0 sm:right-8 sm:top-8"
                    />
                  ) : null}

                  <BoardColumnShell title={column.key} count={column.tasks.length}>
                    <div className="space-y-3">
                      {column.tasks.length ? (
                        column.tasks.map((task) => {
                          const visibleLabels = task.labels.filter(
                            (label) => !label.name.startsWith("Status:")
                          );
                          const taskLabels =
                            visibleLabels.length > 0 ? visibleLabels : [{ name: "Household" }];

                          return (
                            <article
                              key={task.number}
                              className="rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] p-4 shadow-[var(--shadow-card)] transition-colors hover:bg-[color:var(--surface-1)]"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex flex-wrap gap-2">
                                  {taskLabels.map((label) => (
                                    <span key={label.name} className={labelChipClassName}>
                                      {label.name}
                                    </span>
                                  ))}
                                </div>

                                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] text-sm font-medium text-muted-foreground">
                                  {(task.user?.login ?? "?").slice(0, 2).toUpperCase()}
                                </div>
                              </div>

                               <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground">
                                 {task.title}
                               </h3>

                               <div className="mt-4 space-y-4">
                                 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                   <p className="text-sm text-muted-foreground">
                                     #{task.number} • {task.user?.login ?? "unknown"}
                                   </p>

                                   {column.key === "Done" ? (
                                     <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                       <CheckCircle2 className="h-4 w-4" />
                                       Closed
                                     </span>
                                   ) : (
                                     <Button
                                       type="button"
                                       variant="outline"
                                       size="sm"
                                       className={quietButtonClassName}
                                       onClick={() => handleMoveToDone(task.number)}
                                     >
                                       Mark done
                                       <ArrowRight className="h-4 w-4" />
                                     </Button>
                                   )}
                                 </div>

                                 <TaskAssignmentControl
                                   task={task}
                                   viewerLogin={viewer?.login ?? null}
                                   canAssignOthers={viewer?.canAssignOthers ?? false}
                                   memberLogins={memberLogins}
                                   isSubmitting={assigningTaskNumber === task.number}
                                   onAssign={(assignee) => handleAssign(task.number, assignee)}
                                   interactive={column.key !== "Done"}
                                 />
                               </div>
                             </article>
                           );
                        })
                      ) : (
                        <div className="rounded-[var(--radius-control)] border border-dashed border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-4 py-10 text-center text-sm font-medium text-muted-foreground">
                          {column.emptyLabel}
                        </div>
                      )}
                    </div>
                  </BoardColumnShell>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
