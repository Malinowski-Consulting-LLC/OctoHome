"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchTasks, completeTask, getOctokit } from "@/lib/github";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import Sidebar from "@/components/sidebar";
import { KanbanSquare, Loader2, MoreHorizontal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MagicalCelebration } from "@/components/magic/magical-celebration";

const COLUMNS = ["To Do", "This Week", "In Progress", "Done"];

export default function BoardPage() {
  const { data: session } = useSession();
  const { repoOwner, repoName } = useOnboardingStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    async function load() {
      // @ts-ignore
      if (session?.accessToken && repoOwner && repoName) {
        setLoading(true);
        try {
          // @ts-ignore
          const octokit = getOctokit(session.accessToken as string);
          // Fetch both open and closed issues for the board
          const { data } = await octokit.issues.listForRepo({
            owner: repoOwner,
            repo: repoName,
            state: "all",
            per_page: 100,
          });
          setTasks(data.filter(i => !i.pull_request));
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    }
    load();
  }, [session, repoOwner, repoName]);

  const handleMoveToDone = async (num: number) => {
    // @ts-ignore
    if (session?.accessToken && repoOwner && repoName) {
      setShowCelebration(true);
      // Optimistic update
      setTasks(tasks.map(t => t.number === num ? { ...t, state: 'closed' } : t));
      // @ts-ignore
      await completeTask(session.accessToken, repoOwner, repoName, num);
    }
  };

  const getColumnTasks = (col: string) => {
    if (col === "Done") return tasks.filter(t => t.state === "closed");

    // For other columns, we look for labels like "Status: To Do"
    // If no status label, it defaults to "To Do"
    return tasks.filter(t => {
      if (t.state === "closed") return false;
      const statusLabel = t.labels.find((l: any) => l.name.startsWith("Status:"));
      if (!statusLabel && col === "To Do") return true;
      return statusLabel?.name === `Status: ${col}`;
    });
  };

  return (
    <div className="flex min-h-screen bg-white">
      <MagicalCelebration active={showCelebration} onComplete={() => setShowCelebration(false)} />
      <Sidebar />
      <main className="flex-1 p-12 flex flex-col overflow-hidden">
        <header className="mb-12">
          <h1 className="text-6xl font-black uppercase tracking-tighter flex items-center gap-4">
            <KanbanSquare className="w-12 h-12" /> Family Board
          </h1>
          <p className="text-2xl font-bold text-zinc-600 mt-2">
            Track the flow of household chores.
          </p>
        </header>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin" />
            <p className="text-2xl font-black uppercase">Organizing the Board...</p>
          </div>
        ) : (
          <div className="flex-1 flex gap-8 overflow-x-auto pb-8">
            {COLUMNS.map(col => (
              <div key={col} className="w-96 flex-shrink-0 flex flex-col">
                <div className="border-b-8 border-black pb-4 mb-6 flex justify-between items-end">
                  <h2 className="text-3xl font-black uppercase tracking-tight">{col}</h2>
                  <span className="text-xl font-black bg-black text-white px-3 py-1">{getColumnTasks(col).length}</span>
                </div>
                
                <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                  {getColumnTasks(col).map((task) => (
                    <div key={task.number} className="border-4 border-black p-6 bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-1 flex-wrap">
                          {task.labels.filter((l: any) => !l.name.startsWith("Status:")).map((l: any) => (
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
                          {task.user.login.slice(0, 2).toUpperCase()}
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 border-2 font-black text-xs">
                          MOVE <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
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
