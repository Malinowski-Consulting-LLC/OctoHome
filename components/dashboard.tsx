"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  ArrowRight,
  Flame,
  KanbanSquare,
  ListTodo,
  Loader2,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

import { ActionGroup } from "@/components/action-group";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import type { FamilyMember, IssueTask } from "@/lib/types";
import { useOnboardingStore } from "@/store/use-onboarding-store";

type QuickLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const quickLinks: QuickLink[] = [
  {
    href: "/tasks",
    label: "Tasks",
    description: "Browse the current chore list and close out the next thing on deck.",
    icon: ListTodo,
  },
  {
    href: "/board",
    label: "Board",
    description: "See what is open, what is done, and where the family flow is getting stuck.",
    icon: KanbanSquare,
  },
  {
    href: "/family",
    label: "Family",
    description: "Check points, streaks, and the current household momentum at a glance.",
    icon: Users,
  },
];

const actionClassName =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-[color:var(--interactive-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-color)]";

const primaryActionClassName =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border border-transparent bg-[color:var(--accent-solid)] px-4 py-2.5 text-sm font-medium text-[color:var(--app-bg)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-color)]";

function getTaskLabel(task: IssueTask) {
  return task.labels[0]?.name ?? "Household";
}

function getInitials(login?: string | null) {
  return (login ?? "GH").slice(0, 2).toUpperCase();
}

export default function Dashboard() {
  const { data: session } = useSession();
  const { householdName, repoOwner, repoName } = useOnboardingStore();
  const hasRepo = Boolean(repoOwner && repoName);
  const repoLabel = hasRepo ? `${repoOwner}/${repoName}` : "your household repo";
  const [tasks, setTasks] = useState<IssueTask[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberWarning, setMemberWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!repoOwner || !repoName) {
      return;
    }

    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      setMemberWarning(null);

      try {
        const [tasksResult, familyResult] = await Promise.allSettled([
          fetch("/api/tasks", {
            headers: { "x-octohome-repo-owner": repoOwner },
          }),
          fetch("/api/family", {
            headers: { "x-octohome-repo-owner": repoOwner },
          }),
        ]);

        if (!active) {
          return;
        }

        if (tasksResult.status === "rejected") {
          setTasks([]);
          setMembers([]);
          setError("Failed to load dashboard tasks.");
          setLoading(false);
          return;
        }

        const taskResponse = tasksResult.value;
        const taskPayload = (await taskResponse.json()) as {
          tasks?: IssueTask[];
          error?: string;
        };

        if (!taskResponse.ok) {
          setTasks([]);
          setMembers([]);
          setError(taskPayload.error ?? "Failed to load dashboard tasks.");
          setLoading(false);
          return;
        }

        setTasks(taskPayload.tasks ?? []);

        if (familyResult.status === "fulfilled") {
          const familyResponse = familyResult.value;
          const familyPayload = (await familyResponse.json()) as {
            members?: FamilyMember[];
            error?: string;
          };

          if (familyResponse.ok) {
            setMembers(familyPayload.members ?? []);
          } else {
            setMembers([]);
            setMemberWarning(familyPayload.error ?? "Member stats are unavailable for this repository.");
          }
        } else {
          setMembers([]);
          setMemberWarning("Member stats are temporarily unavailable.");
        }

        setLoading(false);
      } catch {
        if (!active) {
          return;
        }

        setTasks([]);
        setMembers([]);
        setError("Failed to load the dashboard.");
        setMemberWarning("Member stats are temporarily unavailable.");
        setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [repoName, repoOwner]);

  const currentMember = useMemo(() => {
    const login = session?.user?.login?.toLowerCase();
    if (!login) {
      return null;
    }

    return members.find((member) => member.login.toLowerCase() === login) ?? null;
  }, [members, session?.user?.login]);

  const primaryMetric = currentMember
    ? { label: "Your streak", value: currentMember.streak, icon: Flame, iconClassName: "text-rose-500" }
    : { label: "Members", value: members.length, icon: Users, iconClassName: "text-foreground" };

  const secondaryMetric = currentMember
    ? { label: "Your points", value: currentMember.points, icon: Star, iconClassName: "text-amber-500" }
    : { label: "Open tasks", value: tasks.length, icon: ListTodo, iconClassName: "text-foreground" };

  const currentFocus = tasks.slice(0, 3);
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const PrimaryMetricIcon = primaryMetric.icon;
  const SecondaryMetricIcon = secondaryMetric.icon;

  return (
    <AppShell width="full" contentClassName="max-w-6xl">
      <PageHeader
        title={`Hello, ${firstName}`}
        subtitle={`Welcome back to ${householdName || "OctoHome"}. Your household workspace stays connected to ${repoLabel}.`}
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Home overview
          </span>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.8fr)]">
        <SurfaceCard tone="accent" data-card-role="hero" className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[image:var(--hero-glow)] opacity-50 blur-3xl"
            data-magic-effect
          />
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Aether command surface
            </div>

            <div className="max-w-2xl space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                Stay on top of the day without the noise.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                Describe a chore in plain language or jump straight into your active task list. OctoHome will write the
                result into {repoLabel}.
              </p>
              {memberWarning ? (
                <p className="text-sm leading-6 text-muted-foreground">{memberWarning}</p>
              ) : null}
            </div>

            <ActionGroup>
              <Link href="/ai" className={primaryActionClassName}>
                Open AI Copilot
              </Link>
              <Link href="/tasks/new" className={actionClassName}>
                Add task
              </Link>
            </ActionGroup>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard
            label={primaryMetric.label}
            value={primaryMetric.value}
            icon={<PrimaryMetricIcon className={`h-5 w-5 ${primaryMetric.iconClassName}`} />}
          />
          <MetricCard
            label={secondaryMetric.label}
            value={secondaryMetric.value}
            icon={<SecondaryMetricIcon className={`h-5 w-5 ${secondaryMetric.iconClassName}`} />}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-color)]">
              <SurfaceCard className="h-full transition-colors group-hover:bg-[color:var(--interactive-hover)]">
                <div className="flex h-full items-start justify-between gap-4">
                  <div className="space-y-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] bg-[color:var(--interactive-bg)] text-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-2">
                      <h2 className="text-base font-semibold text-foreground">{item.label}</h2>
                      <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </SurfaceCard>
            </Link>
          );
        })}
      </div>

      <section className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Focus queue</p>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Current focus</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            The next few open chores worth checking in on across your household repo.
          </p>
        </div>

        {!hasRepo ? (
          <SurfaceCard className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-destructive" />
              <div className="space-y-2">
                <p className="text-base font-semibold text-foreground">Connect a household repository first</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Finish onboarding to load the dashboard and start surfacing your family’s current work.
                </p>
              </div>
            </div>
            <ActionGroup>
              <Link href="/" className={actionClassName}>
                Go home
              </Link>
            </ActionGroup>
          </SurfaceCard>
        ) : loading ? (
          <SurfaceCard className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Refreshing the latest household tasks</span>
            </div>
          </SurfaceCard>
        ) : error ? (
          <SurfaceCard className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-destructive" />
              <div className="space-y-2">
                <p className="text-base font-semibold text-foreground">Tasks could not be loaded</p>
                <p className="text-sm leading-6 text-muted-foreground">{error}</p>
              </div>
            </div>
            <ActionGroup>
              <Link href="/tasks" className={actionClassName}>
                Open tasks
              </Link>
            </ActionGroup>
          </SurfaceCard>
        ) : currentFocus.length === 0 ? (
          <SurfaceCard className="space-y-4">
            <div className="space-y-2">
              <p className="text-base font-semibold text-foreground">Nothing is waiting right now</p>
              <p className="text-sm leading-6 text-muted-foreground">
                You are all caught up. Add a task manually or use AI Copilot to capture the next household chore.
              </p>
            </div>
            <ActionGroup>
              <Link href="/tasks/new" className={primaryActionClassName}>
                Create task
              </Link>
              <Link href="/ai" className={actionClassName}>
                Open AI
              </Link>
            </ActionGroup>
          </SurfaceCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {currentFocus.map((task) => (
              <SurfaceCard key={task.number} className="flex h-full flex-col justify-between gap-5">
                <div className="space-y-4">
                  <span className="inline-flex items-center rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {getTaskLabel(task)}
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold leading-snug text-foreground">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">Issue #{task.number}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] text-sm font-semibold text-foreground">
                    {getInitials(task.user?.login)}
                  </div>
                  <Link href="/tasks" className={actionClassName}>
                    Open tasks
                  </Link>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
