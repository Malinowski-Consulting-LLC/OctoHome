"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import RepoRequiredState from "@/components/repo-required-state";
import { Sparkles, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnergyOrb } from "@/components/magic/energy-orb";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";

interface Message {
  role: "ai" | "user";
  content: string;
  loading?: boolean;
}

export default function AICopilotPage() {
  const homeRepo = useResolvedHomeRepo();
  const { repoOwner, repoName } = homeRepo;
  const repoReady = Boolean(repoOwner && repoName);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "Hi! Tell me what needs doing and I will turn it into a GitHub issue. Try saying 'Add a task to buy milk'.",
    }
  ]);
  const [orbState, setOrbState] = useState<"idle" | "thinking" | "speaking" | "error">("idle");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (homeRepo.status !== "ready") {
    return (
      <div className="flex min-h-screen bg-zinc-50 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-12 overflow-y-auto">
          <RepoRequiredState status={homeRepo.status} error={homeRepo.error} onRetry={homeRepo.refresh} />
        </main>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !repoReady) return;

    const userText = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userText }, { role: "ai", content: "...", loading: true }]);
    setOrbState("thinking");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-octohome-repo-owner": repoOwner,
        },
        body: JSON.stringify({ prompt: userText }),
      });
      const data = await res.json();

      setOrbState("speaking");
      setMessages(prev => prev.filter(m => !m.loading).concat({ 
        role: "ai", 
        content: data.success 
          ? `✨ Heuristic capture complete — I added "${data.title}" with the ${data.label} label.`
          : `Sorry, I couldn't create that issue: ${data.error}` 
      }));
      
      setTimeout(() => setOrbState("idle"), 2000);
    } catch (error) {
      console.error(error);
      setOrbState("error");
      setMessages(prev => prev.filter(m => !m.loading).concat({ role: "ai", content: "Something went wrong while creating the issue. Check your GitHub connection and household repo settings." }));
      setTimeout(() => setOrbState("idle"), 3000);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-12 overflow-hidden">
        <header className="mb-12 flex-shrink-0 flex justify-between items-end">
          <div>
            <h1 className="text-7xl font-black uppercase tracking-tighter flex items-center gap-6">
              <Sparkles className="w-16 h-16 text-yellow-500" /> Family Copilot
            </h1>
            <p className="text-3xl font-bold text-zinc-500 mt-4 uppercase italic">
              Tell OctoHome what needs doing and it will create a GitHub issue in {repoOwner}/{repoName}.
            </p>
          </div>
          <EnergyOrb state={orbState} className="w-32 h-32 mr-8" />
        </header>

        <div className="flex-1 border-8 border-black overflow-hidden flex flex-col bg-white shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-8 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-20 h-20 border-8 border-black flex-shrink-0 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${m.role === "ai" ? "bg-black text-white" : "bg-white text-black"}`}>
                  {m.role === "ai" ? <Bot className="w-10 h-10" /> : <User className="w-10 h-10" />}
                </div>
                <div className={`max-w-3xl p-8 border-8 border-black text-3xl font-black uppercase italic tracking-tight shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${m.role === "ai" ? "bg-white" : "bg-zinc-100"}`}>
                  {m.loading ? (
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-black rounded-full animate-bounce" />
                      <div className="w-3 h-3 bg-black rounded-full animate-bounce [animation-delay:-.3s]" />
                      <div className="w-3 h-3 bg-black rounded-full animate-bounce [animation-delay:-.5s]" />
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-10 bg-zinc-50 border-t-8 border-black flex gap-6">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={repoReady ? "e.g. ADD A TASK TO MOW THE LAWN..." : "FINISH ONBOARDING TO CONNECT A REPOSITORY"}
              disabled={!repoReady}
              className="flex-1 h-28 border-8 border-black px-10 text-4xl font-black uppercase italic outline-none focus:ring-12 focus:ring-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            />
            <Button type="submit" disabled={!repoReady} className="h-28 px-16 text-4xl border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:-translate-y-1 transition-transform">
              <Send className="w-12 h-12" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
