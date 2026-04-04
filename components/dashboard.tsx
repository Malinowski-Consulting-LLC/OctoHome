"use client";

import { useSession } from "next-auth/react";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import Sidebar from "@/components/sidebar";
import { Sparkles, Flame, Star, CheckCircle, ListTodo, Users, KanbanSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BentoGrid, BentoCard } from "./magic/bento-grid";
import { AnimatedBeam } from "./magic/animated-beam";
import { MagicalCelebration } from "./magic/magical-celebration";
import { useRef, useState } from "react";

export default function Dashboard() {
  const { data: session } = useSession();
  const { householdName } = useOnboardingStore();
  const [showCelebration, setShowCelebration] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<HTMLDivElement>(null);
  const streakRef = useRef<HTMLDivElement>(null);

  const handleComplete = () => {
    setShowCelebration(true);
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans" ref={containerRef}>
      <MagicalCelebration active={showCelebration} onComplete={() => setShowCelebration(false)} />
      <Sidebar />
      <main className="flex-1 p-12 overflow-y-auto relative">
        {/* Animated Beams */}
        <AnimatedBeam containerRef={containerRef} fromRef={pulseRef} toRef={streakRef} curvature={50} />
        <AnimatedBeam containerRef={containerRef} fromRef={pulseRef} toRef={pointsRef} curvature={-50} />

        <header className="flex justify-between items-start mb-12 relative z-10">
          <div>
            <h1 className="text-7xl font-black uppercase tracking-tighter leading-none">
              Hello, {session?.user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-2xl font-bold text-zinc-500 mt-4 uppercase italic">
              Welcome back to {householdName || "OctoHome"}.
            </p>
          </div>
          <div className="flex gap-6">
            <div ref={streakRef} className="border-8 border-black p-6 text-center min-w-[160px] bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <Flame className="w-10 h-10 mx-auto mb-2 text-red-600" />
              <div className="text-sm font-black uppercase tracking-widest">Streak</div>
              <div className="text-5xl font-black italic">12</div>
            </div>
            <div ref={pointsRef} className="border-8 border-black p-6 text-center min-w-[160px] bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <Star className="w-10 h-10 mx-auto mb-2 text-yellow-500" />
              <div className="text-sm font-black uppercase tracking-widest">Points</div>
              <div className="text-5xl font-black italic">450</div>
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
                    &quot;Dad has done 70% of chores this week. Would you like to help out?&quot;
                  </p>
                </div>
            <div className="relative z-10 flex gap-4 mt-8">
              <Button variant="outline" className="bg-white text-black border-none h-20 px-10 text-2xl font-black">
                ASK AI
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Buy Milk and Eggs", label: "Groceries", color: "bg-green-100" },
              { title: "Pay Electric Bill", label: "Bills", color: "bg-orange-100" },
              { title: "Mow the Lawn", label: "Maintenance", color: "bg-blue-100" },
            ].map((task, i) => (
              <div key={i} className="border-8 border-black p-8 flex flex-col justify-between hover:translate-x-2 hover:-translate-y-2 transition-all bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] group">
                <div>
                  <span className={`inline-block border-4 border-black px-4 py-1 text-sm font-black uppercase mb-6 ${task.color}`}>
                    {task.label}
                  </span>
                  <h3 className="text-3xl font-black leading-none uppercase italic">{task.title}</h3>
                </div>
                <div className="mt-12 flex justify-between items-center">
                  <div className="w-14 h-14 border-4 border-black bg-zinc-100 rounded-full flex items-center justify-center font-black text-xl">MB</div>
                  <button
                    onClick={handleComplete}
                    className="w-20 h-20 border-8 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all transform active:scale-90 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <CheckCircle className="w-10 h-10" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
