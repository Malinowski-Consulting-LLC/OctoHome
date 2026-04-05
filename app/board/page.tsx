"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/sidebar";
import RepoRequiredState from "@/components/repo-required-state";
import { KanbanSquare, Loader2, MoreHorizontal, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MagicalCelebration } from "@/components/magic/magical-celebration";
import { AnimatedBeam } from "@/components/magic/animated-beam";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";
import { useAppearanceStore } from "@/store/use-appearance-store";
import type { IssueTask } from "@/lib/types";

const COLUMNS = ["Open", "Done"];

export default function BoardPage() {
  const { magicEnabled } = useAppearanceStore();
  const { status, error: repoError, refresh, repoOwner, repoName } = useResolvedHomeRepo();
  const [tasks, setTasks] = useState<IssueTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const doneHeaderRef = useRef<HTMLDivElement>(null);
  const sidebarTargetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "ready" || !repoOwner || !repoName) return;
    async function load() {
      setLoading(true);
      setError(null);
      setNotice(null);
      try {
        const res = await fetch(
          `/api/board?owner=${encodeURIComponent(repoOwner)}&repo=${encodeURIComponent(repoName)}`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to fetch board");
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
      <div className="flex min-h-screen bg-zinc-50 font-sans">
        <Sidebar />
        <main className="flex-1 p-12 overflow-y-auto">
          <RepoRequiredState status={status} error={repoError} onRetry={refresh} />
        </main>
      </div>
    );
  }

  const handleMoveToDone = async (num: number) => {
    if (!repoOwner || !repoName) return;
    // Optimistic update — keep a snapshot for rollback on failure.
    const snapshot = tasks;
    setTasks((prev) => prev.map(t => t.number === num ? { ...t, state: "closed" } : t));
    try {
      const res = await fetch(`/api/tasks/${num}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: repoOwner, repo: repoName }),
      });
      const json = await res.json();
      if (!res.ok) {
        setTasks(snapshot);
        setError(json.error ?? "Failed to close task");
        return;
      }
      setNotice(json.warning ?? null);
      setShowCelebration(true);
    } catch {
      setTasks(snapshot);
      setError("Failed to close task. Please try again.");
    }
  };

  const getColumnTasks = (col: string) => {
    if (col === "Done") return tasks.filter(t => t.state === "closed");
    return tasks.filter(t => t.state !== "closed");
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans" ref={containerRef}>
      <MagicalCelebration active={showCelebration} onComplete={() => setShowCelebration(false)} />
      {magicEnabled ? (
        <AnimatedBeam 
          containerRef={containerRef} 
          fromRef={doneHeaderRef} 
          toRef={sidebarTargetRef} 
          curvature={-100}
          duration={3}
        />
      ) : null}
      <Sidebar familyRef={sidebarTargetRef as any} />
      <main className="flex-1 p-12 flex flex-col overflow-hidden">
        <header className="mb-12">
          <h1 className="text-6xl font-black uppercase tracking-tighter flex items-center gap-4">
            <KanbanSquare className="w-12 h-12" /> Family Board
          </h1>
          <p className="text-2xl font-bold text-zinc-600 mt-2">
            Track open tasks and completed chores.
          </p>
        </header>

        {notice ? (
          <div className="mb-8 border-4 border-amber-500 bg-amber-50 p-6">
            <p className="text-lg font-black uppercase text-amber-700">{notice}</p>
          </div>
        ) : null}

        {error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="border-8 border-red-600 p-12 flex items-center gap-6">
              <AlertCircle className="w-12 h-12 text-red-600 flex-shrink-0" />
              <p className="text-2xl font-black uppercase text-red-600">{error}</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin" />
            <p className="text-2xl font-black uppercase">Organizing the Board...</p>
          </div>
        ) : (
          <div className="flex-1 flex gap-8 overflow-x-auto pb-8">
            {COLUMNS.map(col => (
              <div key={col} className="w-96 flex-shrink-0 flex flex-col">
                <div 
                  ref={col === "Done" ? doneHeaderRef : null}
                  className="border-b-8 border-black pb-4 mb-6 flex justify-between items-end bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <h2 className="text-3xl font-black uppercase tracking-tight">{col}</h2>
                  <span className="text-xl font-black bg-black text-white px-3 py-1">{getColumnTasks(col).length}</span>
                </div>
                
                <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                  {getColumnTasks(col).map((task) => (
                    <div key={task.number} className="border-4 border-black p-6 bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-1 flex-wrap">
                          {task.labels.filter(l => !l.name.startsWith("Status:")).map((l) => (
                            <span key={l.name} className="text-[10px] font-black uppercase px-2 py-0.5 border border-black">
                              {l.name}
                            </span>
                          ))}
                        </div>
                        <button className="text-zinc-400 hover:text-black">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                      <h3 className="text-xl font-black leading-tight mb-4 group-hover:underline">{task.title}</h3>
                      <div className="flex justify-between items-center">
                        <div className="w-8 h-8 rounded-full border-2 border-black bg-zinc-100 flex items-center justify-center text-xs font-bold">
                          {(task.user?.login ?? "?").slice(0, 2).toUpperCase()}
                        </div>
                        {col !== "Done" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 border-2 font-black text-xs"
                            onClick={() => handleMoveToDone(task.number)}
                          >
                            DONE <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {getColumnTasks(col).length === 0 && (
                    <div className="border-4 border-black border-dashed h-32 flex items-center justify-center text-zinc-300 font-black uppercase">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
