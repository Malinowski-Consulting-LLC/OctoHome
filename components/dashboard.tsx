"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import type { FamilyMember, IssueTask } from "@/lib/types";
import Sidebar from "@/components/sidebar";
import { Sparkles, Flame, Star, ListTodo, Users, KanbanSquare, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BentoGrid, BentoCard } from "./magic/bento-grid";
import { AnimatedBeam } from "./magic/animated-beam";

const labelToneMap: Record<string, string> = {
  groceries: "bg-green-100",
  bills: "bg-orange-100",
  maintenance: "bg-blue-100",
  school: "bg-purple-100",
  health: "bg-red-100",
  urgent: "bg-yellow-100",
};

function getTaskLabel(task: IssueTask) {
  return task.labels[0]?.name ?? "Household";
}

function getTaskTone(task: IssueTask) {
  return labelToneMap[getTaskLabel(task).toLowerCase()] ?? "bg-zinc-100";
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

  const containerRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const primaryMetricRef = useRef<HTMLDivElement>(null);
  const secondaryMetricRef = useRef<HTMLDivElement>(null);

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
            setMemberWarning(
              familyPayload.error ?? "Member stats are unavailable for this repository."
            );
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
    ? { label: "Your Streak", value: currentMember.streak, icon: Flame, iconClassName: "text-red-600" }
    : { label: "Members", value: members.length, icon: Users, iconClassName: "text-zinc-700" };

  const secondaryMetric = currentMember
    ? { label: "Your Points", value: currentMember.points, icon: Star, iconClassName: "text-yellow-500" }
    : { label: "Open Tasks", value: tasks.length, icon: ListTodo, iconClassName: "text-black" };

  const currentFocus = tasks.slice(0, 3);
  const PrimaryMetricIcon = primaryMetric.icon;
  const SecondaryMetricIcon = secondaryMetric.icon;

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans" ref={containerRef}>
      <Sidebar />
      <main className="flex-1 p-12 overflow-y-auto relative">
        {/* Animated Beams */}
        <AnimatedBeam containerRef={containerRef} fromRef={pulseRef} toRef={primaryMetricRef} curvature={50} />
        <AnimatedBeam containerRef={containerRef} fromRef={pulseRef} toRef={secondaryMetricRef} curvature={-50} />

        <header className="flex justify-between items-start mb-12 relative z-10">
          <div>
            <h1 className="text-7xl font-black uppercase tracking-tighter leading-none">
              Hello, {session?.user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-2xl font-bold text-zinc-500 mt-4 uppercase italic">
              Welcome back to {householdName || "OctoHome"}.
            </p>
            {memberWarning ? (
              <p className="mt-4 text-sm font-black uppercase tracking-wide text-zinc-500">
                {memberWarning}
              </p>
            ) : null}
          </div>
          <div className="flex gap-6">
            <div ref={primaryMetricRef} className="border-8 border-black p-6 text-center min-w-[180px] bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <PrimaryMetricIcon className={`w-10 h-10 mx-auto mb-2 ${primaryMetric.iconClassName}`} />
              <div className="text-sm font-black uppercase tracking-widest">{primaryMetric.label}</div>
              <div className="text-5xl font-black italic">{primaryMetric.value}</div>
            </div>
            <div ref={secondaryMetricRef} className="border-8 border-black p-6 text-center min-w-[180px] bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <SecondaryMetricIcon className={`w-10 h-10 mx-auto mb-2 ${secondaryMetric.iconClassName}`} />
              <div className="text-sm font-black uppercase tracking-widest">{secondaryMetric.label}</div>
              <div className="text-5xl font-black italic">{secondaryMetric.value}</div>
            </div>
          </div>
        </header>

        {/* Bento Grid */}
        <BentoGrid className="relative z-10">
          <div ref={pulseRef} className="md:col-span-2 md:row-span-1 border-8 border-black p-10 bg-black text-white relative overflow-hidden flex flex-col justify-between shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="relative z-10">
                  <h2 className="text-5xl font-black uppercase tracking-tighter flex items-center gap-4 mb-4">
                    <Sparkles className="w-12 h-12 text-yellow-400" /> AI COPILOT
                  </h2>
                  <p className="text-3xl font-bold italic opacity-80 leading-tight max-w-2xl">
                    Describe a chore in plain language and OctoHome will heuristically turn it into a GitHub issue for {repoLabel}.
                  </p>
                </div>
            <div className="relative z-10 flex gap-4 mt-8">
              <Button asChild variant="outline" className="bg-white text-black border-none h-20 px-10 text-2xl font-black">
                <Link href="/ai">Open AI</Link>
              </Button>
              <Button asChild className="h-20 px-10 text-2xl font-black">
                <Link href="/tasks/new">Add Task</Link>
              </Button>
            </div>
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800 rounded-full -mr-48 -mt-48 opacity-50 blur-3xl animate-pulse-slow"></div>
          </div>

          <BentoCard
            name="Tasks"
            className="md:col-span-1"
            Icon={ListTodo}
            description="Manage your daily chores."
            href="/tasks"
            cta="View All"
          />

          <BentoCard
            name="Board"
            className="md:col-span-1"
            Icon={KanbanSquare}
            description="Visual household flow."
            href="/board"
            cta="Open Board"
          />

          <BentoCard
            name="Family"
            className="md:col-span-2"
            Icon={Users}
            description="Leaderboard and members."
            href="/family"
            cta="See Rankings"
          />
        </BentoGrid>

        <div className="mt-16 relative z-10">
          <h2 className="text-5xl font-black uppercase tracking-tighter mb-10 italic border-b-8 border-black pb-4 inline-block">Current Focus</h2>
          {!hasRepo ? (
            <div className="border-8 border-red-600 p-12 flex items-center justify-between gap-6 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-6">
                <AlertCircle className="w-10 h-10 text-red-600 flex-shrink-0" />
                <p className="text-2xl font-black uppercase text-red-600">
                  Connect a household repository to load the dashboard.
                </p>
              </div>
              <Button asChild variant="outline" className="h-16 px-8 text-xl">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          ) : loading ? (
            <div className="border-8 border-black p-12 flex items-center gap-6 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <Loader2 className="w-10 h-10 animate-spin flex-shrink-0" />
              <p className="text-2xl font-black uppercase">Loading the latest household tasks...</p>
            </div>
          ) : error ? (
            <div className="border-8 border-red-600 p-12 flex items-center justify-between gap-6 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-6">
                <AlertCircle className="w-10 h-10 text-red-600 flex-shrink-0" />
                <p className="text-2xl font-black uppercase text-red-600">{error}</p>
              </div>
              <Button asChild variant="outline" className="h-16 px-8 text-xl">
                <Link href="/tasks">Open Tasks</Link>
              </Button>
            </div>
          ) : currentFocus.length === 0 ? (
            <div className="border-8 border-black p-12 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <p className="text-3xl font-black uppercase italic">
                No open household tasks right now.
              </p>
              <p className="text-xl font-bold text-zinc-500 uppercase">
                Add a task manually or use the heuristic AI flow to create one quickly.
              </p>
              <div className="flex gap-4">
                <Button asChild className="h-16 px-8 text-xl">
                  <Link href="/tasks/new">Create Task</Link>
                </Button>
                <Button asChild variant="outline" className="h-16 px-8 text-xl">
                  <Link href="/ai">Open AI</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {currentFocus.map((task) => (
                <div key={task.number} className="border-8 border-black p-8 flex flex-col justify-between hover:translate-x-2 hover:-translate-y-2 transition-all bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] group">
                  <div>
                    <span className={`inline-block border-4 border-black px-4 py-1 text-sm font-black uppercase mb-6 ${getTaskTone(task)}`}>
                      {getTaskLabel(task)}
                    </span>
                    <h3 className="text-3xl font-black leading-none uppercase italic">{task.title}</h3>
                    <p className="mt-4 text-sm font-black uppercase text-zinc-400">Issue #{task.number}</p>
                  </div>
                  <div className="mt-12 flex justify-between items-center gap-4">
                    <div className="w-14 h-14 border-4 border-black bg-zinc-100 rounded-full flex items-center justify-center font-black text-xl">
                      {getInitials(task.user?.login)}
                    </div>
                    <Button asChild variant="outline" className="h-16 px-6 text-lg">
                      <Link href="/tasks">Open Tasks</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
