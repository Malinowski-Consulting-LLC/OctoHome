"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import RepoRequiredState from "@/components/repo-required-state";
import { CheckCircle, ListTodo, Plus, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MagicalCelebration } from "@/components/magic/magical-celebration";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";
import type { IssueTask } from "@/lib/types";

export default function TasksPage() {
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
        const res = await fetch("/api/tasks", {
          headers: { "x-octohome-repo-owner": repoOwner },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to fetch tasks");
        setTasks(json.tasks as IssueTask[]);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [repoName, repoOwner, status]);

  if (status !== "ready") {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 p-12 overflow-y-auto">
          <RepoRequiredState status={status} error={repoError} onRetry={refresh} />
        </main>
      </div>
    );
  }

  const handleComplete = async (num: number) => {
    if (!repoOwner || !repoName) return;
    // Optimistic remove — keep a snapshot to roll back on failure.
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.number !== num));
    try {
      const res = await fetch(`/api/tasks/${num}`, {
        method: "PATCH",
        headers: { "x-octohome-repo-owner": repoOwner },
      });
      const json = await res.json();
      if (!res.ok) {
        setTasks(snapshot);
        setError(json.error ?? "Failed to complete task");
        return;
      }
      setNotice(json.warning ?? null);
      setShowCelebration(true);
    } catch {
      setTasks(snapshot);
      setError("Failed to complete task. Please try again.");
    }
  };

  const filteredTasks = filter === "All"
    ? tasks
    : tasks.filter(t => t.labels.some(l => l.name === filter));

  const uniqueLabels = ["All", ...Array.from(new Set(tasks.flatMap(t => t.labels.map(l => l.name))))];

  return (
    <div className="flex min-h-screen bg-white">
      <MagicalCelebration active={showCelebration} onComplete={() => setShowCelebration(false)} />
      <Sidebar />
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter flex items-center gap-4">
              <ListTodo className="w-12 h-12" /> Household Tasks
            </h1>
            <p className="text-2xl font-bold text-zinc-600 mt-2">
              Everything that needs doing in your home.
            </p>
          </div>
          <Link href="/tasks/new">
            <Button size="lg" className="h-20 text-2xl px-10 border-8 border-black">
              <Plus className="w-8 h-8 mr-2" /> NEW TASK
            </Button>
          </Link>
        </header>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
          {uniqueLabels.map(label => (
            <button
              key={label}
              onClick={() => setFilter(label)}
              className={`px-6 py-3 border-4 font-black uppercase text-xl transition-all ${
                filter === label ? "bg-black text-white border-black" : "border-zinc-200 hover:border-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {notice ? (
          <div className="mb-8 border-4 border-amber-500 bg-amber-50 p-6">
            <p className="text-lg font-black uppercase text-amber-700">{notice}</p>
          </div>
        ) : null}

        {error ? (
          <div className="border-8 border-red-600 p-12 flex items-center gap-6">
            <AlertCircle className="w-12 h-12 text-red-600 flex-shrink-0" />
            <p className="text-2xl font-black uppercase text-red-600">{error}</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-16 h-16 animate-spin" />
            <p className="text-2xl font-black uppercase">Loading Tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="border-8 border-black border-dashed p-24 text-center">
            <CheckCircle className="w-24 h-24 mx-auto mb-6 text-zinc-300" />
            <h2 className="text-4xl font-black uppercase mb-2">Zero Tasks!</h2>
            <p className="text-xl font-bold text-zinc-500">You&apos;re all caught up. Enjoy the family time.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTasks.map((task) => (
              <div key={task.number} className="border-8 border-black p-8 flex items-center justify-between group hover:bg-zinc-50 transition-colors">
                <div className="flex-1">
                  <div className="flex gap-2 mb-4">
                    {task.labels.map((l) => (
                      <span key={l.name} className="border-2 border-black px-3 py-1 text-sm font-black uppercase bg-zinc-100">
                        {l.name}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-4xl font-black tracking-tight leading-none group-hover:underline underline-offset-8">
                    {task.title}
                  </h3>
                  <p className="text-xl font-bold text-zinc-500 mt-4">
                    #{task.number} • Opened by {task.user?.login ?? "unknown"}
                  </p>
                </div>
                <button 
                  onClick={() => handleComplete(task.number)}
                  className="w-20 h-20 border-8 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all transform active:scale-90"
                  aria-label="Complete Task"
                >
                  <CheckCircle className="w-12 h-12" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
