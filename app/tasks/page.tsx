"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { fetchTasks, completeTask } from "@/lib/github";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import Sidebar from "@/components/sidebar";
import { CheckCircle, ListTodo, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MagicalCelebration } from "@/components/magic/magical-celebration";

export default function TasksPage() {
  const { data: session } = useSession();
  const { repoOwner, repoName } = useOnboardingStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    async function load() {
      if (session?.accessToken && repoOwner && repoName) {
        const token = session.accessToken;
        setLoading(true);
        try {
          const fetched = await fetchTasks(token, repoOwner, repoName);
          setTasks(fetched);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    }
    load();
  }, [session, repoOwner, repoName]);

  const handleComplete = async (num: number) => {
    if (session?.accessToken && repoOwner && repoName) {
      const token = session.accessToken;
      setShowCelebration(true);
      setTasks(tasks.filter(t => t.number !== num));
      await completeTask(token, repoOwner, repoName, num);
    }
  };

  const filteredTasks = filter === "All" 
    ? tasks 
    : tasks.filter(t => t.labels.some((l: any) => l.name === filter));

  const uniqueLabels = ["All", ...Array.from(new Set(tasks.flatMap(t => t.labels.map((l: any) => l.name))))];

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

        {loading ? (
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
                    {task.labels.map((l: any) => (
                      <span key={l.name} className="border-2 border-black px-3 py-1 text-sm font-black uppercase bg-zinc-100">
                        {l.name}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-4xl font-black tracking-tight leading-none group-hover:underline underline-offset-8">
                    {task.title}
                  </h3>
                  <p className="text-xl font-bold text-zinc-500 mt-4">
                    #{task.number} • Opened by {task.user.login}
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
