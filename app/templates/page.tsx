"use client";

import { useState } from "react";

import { AlertCircle, Calendar, Loader2, Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import RepoRequiredState from "@/components/repo-required-state";
import Sidebar from "@/components/sidebar";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof DAYS)[number];

const eyebrowClassName =
  "inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground";

const repoBadgeClassName =
  "inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-2 text-sm font-medium text-muted-foreground whitespace-normal break-all";

const fieldClassName =
  "h-12 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-4 text-base font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-[color:var(--ring-color)]";

const primaryButtonClassName =
  "h-11 rounded-[var(--radius-control)] border border-[color:var(--accent-solid)] bg-[color:var(--accent-solid)] px-4 text-sm font-semibold normal-case tracking-normal text-[color:var(--app-bg)] shadow-none hover:opacity-90";

export default function RoutinesPage() {
  const router = useRouter();
  const homeRepo = useResolvedHomeRepo();
  const [title, setTitle] = useState("");
  const [selectedDays, setSelectedDays] = useState<Day[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (homeRepo.status !== "ready") {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-5xl">
            <RepoRequiredState
              status={homeRepo.status}
              error={homeRepo.error}
              onRetry={homeRepo.refresh}
            />
          </div>
        </main>
      </div>
    );
  }

  const toggleDay = (day: Day) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day]));
  };

  const handleCreate = async () => {
    const { repoOwner, repoName } = homeRepo;
    if (!repoOwner || !repoName || !title || selectedDays.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: repoOwner,
          repo: repoName,
          title,
          days: selectedDays,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create routine");
      router.push("/");
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <div className="space-y-3">
            <span className={eyebrowClassName}>
              <Calendar className="h-3.5 w-3.5" />
              Templates
            </span>
            <PageHeader
              title="Household routines"
              subtitle="Turn recurring chores into a GitHub Action-backed routine that opens tasks on a schedule."
              actions={
                <span className={repoBadgeClassName}>
                  {homeRepo.repoOwner}/{homeRepo.repoName}
                </span>
              }
            />
          </div>

          <SurfaceCard className="space-y-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreate();
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label htmlFor="routine-title" className="text-sm font-medium text-foreground">
                  Routine name
                </label>
                <Input
                  id="routine-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Weekly grocery list"
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Repeat every…</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Pick the days when OctoHome should create a fresh task for this routine.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day);

                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggleDay(day)}
                        className={`rounded-[var(--radius-control)] border px-4 py-3 text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-[color:var(--ring-color)] bg-[color:var(--interactive-hover)] text-foreground shadow-[var(--shadow-card)]"
                            : "border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] text-muted-foreground hover:bg-[color:var(--interactive-hover)] hover:text-foreground"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <h2 className="text-base font-semibold text-foreground">How it works</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      OctoHome will add a GitHub Action to your repository so a new task opens at 9:00 AM on the days
                      you selected.
                    </p>
                  </div>
                </div>
              </div>

              {submitError ? (
                <div className="rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-4 py-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <p className="text-sm font-medium text-destructive">{submitError}</p>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-muted-foreground">
                  Routine generation only starts once a name and at least one day are selected.
                </p>

                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !homeRepo.repoOwner ||
                    !homeRepo.repoName ||
                    !title ||
                    selectedDays.length === 0
                  }
                  size="lg"
                  className={`${primaryButtonClassName} w-full sm:w-auto`}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Activate routine
                </Button>
              </div>
            </form>
          </SurfaceCard>
        </div>
      </main>
    </div>
  );
}
