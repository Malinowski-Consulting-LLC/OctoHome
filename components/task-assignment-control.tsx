"use client";

import { Loader2, UserCheck, UserPlus } from "lucide-react";

import type { IssueTask } from "@/lib/types";
import { cn } from "@/lib/utils";

type TaskAssignmentControlProps = {
  task: IssueTask;
  viewerLogin: string | null;
  canAssignOthers: boolean;
  memberLogins: string[];
  isSubmitting: boolean;
  onAssign: (assignee: string | null) => void | Promise<void>;
  className?: string;
  interactive?: boolean;
};

const controlClassName =
  "h-10 rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 text-sm font-medium text-foreground outline-none transition focus:border-[color:var(--ring-color)]";

export function TaskAssignmentControl({
  task,
  viewerLogin,
  canAssignOthers,
  memberLogins,
  isSubmitting,
  onAssign,
  className,
  interactive = true,
}: TaskAssignmentControlProps) {
  const currentAssignee = task.assignees[0] ?? null;
  const currentAssigneeLogin = currentAssignee?.login ?? "";
  const normalizedViewerLogin = viewerLogin?.toLowerCase() ?? null;
  const assignedToViewer =
    normalizedViewerLogin !== null && currentAssigneeLogin.toLowerCase() === normalizedViewerLogin;
  const assignmentLabel = currentAssigneeLogin ? `Assigned to ${currentAssigneeLogin}` : "Unassigned";
  const options = Array.from(
    new Set(
      [viewerLogin ?? "", currentAssigneeLogin, ...memberLogins]
        .map((login) => login.trim())
        .filter((login) => login.length > 0)
    )
  ).sort((left, right) => left.localeCompare(right));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1 font-medium text-foreground">
          <UserCheck className="h-4 w-4" />
          {assignmentLabel}
        </span>
        {assignedToViewer ? <span className="text-xs font-medium uppercase tracking-[0.16em]">You</span> : null}
      </div>

      {!interactive ? null : canAssignOthers ? (
        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Assignee
          </span>
          <div className="flex items-center gap-2">
            <select
              className={cn(controlClassName, "min-w-0 flex-1")}
              disabled={isSubmitting}
              value={currentAssigneeLogin}
              onChange={(event) => {
                const value = event.target.value.trim();
                void onAssign(value.length > 0 ? value : null);
              }}
            >
              <option value="">Unassigned</option>
              {options.map((login) => (
                <option key={login} value={login}>
                  {login}
                </option>
              ))}
            </select>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          </div>
        </label>
      ) : viewerLogin ? (
        <button
          type="button"
          className={cn(
            controlClassName,
            "inline-flex items-center gap-2 px-4",
            assignedToViewer && "border-transparent bg-[color:var(--surface-2)]"
          )}
          disabled={isSubmitting || assignedToViewer}
          onClick={() => void onAssign(viewerLogin)}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {assignedToViewer ? "Assigned to you" : "Assign to me"}
        </button>
      ) : null}
    </div>
  );
}
