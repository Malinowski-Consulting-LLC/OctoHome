"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { PageHeader } from "@/components/page-header";
import RepoRequiredState from "@/components/repo-required-state";
import Sidebar from "@/components/sidebar";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  label: z.string().min(1, "Please select a label"),
  description: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const DEFAULT_LABELS = [
  "Groceries",
  "Bills",
  "Maintenance",
  "School",
  "Health",
  "Urgent",
];

const eyebrowClassName =
  "inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground";

const actionLinkClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-[color:var(--interactive-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-color)] sm:w-auto";

const repoBadgeClassName =
  "inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-2 text-sm font-medium text-muted-foreground whitespace-normal break-all";

const fieldClassName =
  "h-12 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-4 text-base font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-[color:var(--ring-color)]";

const textareaClassName =
  "min-h-36 w-full rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[color:var(--ring-color)]";

const primaryButtonClassName =
  "h-11 rounded-[var(--radius-control)] border border-[color:var(--accent-solid)] bg-[color:var(--accent-solid)] px-4 text-sm font-semibold normal-case tracking-normal text-[color:var(--app-bg)] shadow-none hover:opacity-90";

export default function NewTaskPage() {
  const { status, error: repoError, refresh, repoOwner, repoName } = useResolvedHomeRepo();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      label: "Maintenance",
    },
  });

  const selectedLabel = watch("label");

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

  const onSubmit = async (values: TaskFormValues) => {
    if (!repoOwner || !repoName) return;

    setIsSubmitting(true);
    setSubmitError(null);
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-octohome-repo-owner": repoOwner,
          },
          body: JSON.stringify({
            title: values.title,
            body: values.description || "Created via OctoHome",
            labels: [values.label],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create task");
      router.push("/tasks");
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
              <Save className="h-3.5 w-3.5" />
              Task form
            </span>
            <PageHeader
              title="New household task"
              subtitle="Create a GitHub issue for the next chore, errand, or family follow-up."
              actions={
                <>
                  <span className={repoBadgeClassName}>
                    {repoOwner}/{repoName}
                  </span>
                  <Link href="/tasks" className={actionLinkClassName}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to tasks
                  </Link>
                </>
              }
            />
          </div>

          <SurfaceCard className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <input type="hidden" {...register("label")} />

              <div className="space-y-2">
                <label htmlFor="task-title" className="text-sm font-medium text-foreground">
                  What needs doing?
                </label>
                <Input
                  id="task-title"
                  {...register("title")}
                  placeholder="e.g. Change the air filters"
                  className={fieldClassName}
                />
                {errors.title ? (
                  <p className="text-sm font-medium text-destructive">{errors.title.message}</p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Category</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Choose the label OctoHome should attach when it creates the GitHub issue.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {DEFAULT_LABELS.map((label) => {
                    const isSelected = selectedLabel === label;

                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setValue("label", label, { shouldValidate: true });
                        }}
                        className={`rounded-[var(--radius-control)] border px-4 py-3 text-left text-sm font-medium transition-colors ${
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

                {errors.label ? (
                  <p className="text-sm font-medium text-destructive">{errors.label.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="task-description" className="text-sm font-medium text-foreground">
                  Extra details (optional)
                </label>
                <textarea
                  id="task-description"
                  {...register("description")}
                  rows={6}
                  className={textareaClassName}
                  placeholder="Add helpful notes, instructions, or context for the family."
                />
              </div>

              {submitError ? (
                <div className="rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-4 py-3">
                  <p className="text-sm font-medium text-destructive">{submitError}</p>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-muted-foreground">
                  OctoHome will create the task directly in your connected household repository.
                </p>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || !repoOwner || !repoName}
                  className={`${primaryButtonClassName} w-full sm:w-auto`}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Create task
                </Button>
              </div>
            </form>
          </SurfaceCard>
        </div>
      </main>
    </div>
  );
}
