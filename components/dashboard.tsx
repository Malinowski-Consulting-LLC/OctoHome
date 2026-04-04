"use client";

import { useSession } from "next-auth/react";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import Sidebar from "@/components/sidebar";
import { Sparkles, Flame, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: session } = useSession();
  const { householdName } = useOnboardingStore();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter">
              Hello, {session?.user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-2xl font-bold text-zinc-600 mt-2">
              Welcome back to {householdName || "OctoHome"}.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="border-4 border-black p-4 text-center min-w-[120px]">
              <Flame className="w-8 h-8 mx-auto mb-1 text-red-600" />
              <div className="text-sm font-black uppercase">Streak</div>
              <div className="text-3xl font-black">12</div>
            </div>
            <div className="border-4 border-black p-4 text-center min-w-[120px]">
              <Star className="w-8 h-8 mx-auto mb-1 text-yellow-500" />
              <div className="text-sm font-black uppercase">Points</div>
              <div className="text-3xl font-black">450</div>
            </div>
          </div>
        </header>

        {/* AI Copilot Card */}
        <section className="bg-black text-white p-8 border-4 border-black mb-12 relative overflow-hidden group cursor-pointer hover:bg-zinc-900 transition-colors">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black uppercase flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-yellow-400" /> AI Family Copilot
              </h2>
              <p className="text-xl font-medium text-zinc-300">
                "Looks like Dad has done 70% of chores this week. Want to help out?"
              </p>
            </div>
            <Button variant="outline" className="bg-white text-black border-none h-16 text-xl">
              ASK AI
            </Button>
          </div>
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full -mr-32 -mt-32 opacity-50"></div>
        </section>

        {/* Task Grid */}
        <h2 className="text-4xl font-black uppercase mb-8 border-b-8 border-black pb-4">Current Focus</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: "Buy Milk and Eggs", label: "Groceries", color: "bg-green-100" },
            { title: "Pay Electric Bill", label: "Bills", color: "bg-orange-100" },
            { title: "Mow the Lawn", label: "Maintenance", color: "bg-blue-100" },
          ].map((task, i) => (
            <div key={i} className="border-4 border-black p-6 flex flex-col justify-between hover:translate-x-2 hover:-translate-y-2 transition-transform bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <span className={`inline-block border-2 border-black px-3 py-1 text-sm font-black uppercase mb-4 ${task.color}`}>
                  {task.label}
                </span>
                <h3 className="text-2xl font-black leading-tight">{task.title}</h3>
              </div>
              <div className="mt-8 flex justify-between items-center">
                <div className="flex -space-x-2">
                   <div className="w-10 h-10 border-2 border-black bg-zinc-200 rounded-full flex items-center justify-center font-bold">MB</div>
                </div>
                <button className="w-14 h-14 border-4 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                  <CheckCircle className="w-8 h-8" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
