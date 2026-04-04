"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/sidebar";
import { Sparkles, Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store/use-onboarding-store";

interface Message {
  role: "ai" | "user";
  content: string;
  loading?: boolean;
}

export default function AICopilotPage() {
  const { data: session } = useSession();
  const { repoOwner, repoName } = useOnboardingStore();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hi! I'm your Family Copilot. I can help you add tasks, groceries, or summarize what's happening at home. Try saying 'Add a task to buy milk'!" }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userText }, { role: "ai", content: "...", loading: true }]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        body: JSON.stringify({ prompt: userText, repoOwner, repoName }),
      });
      const data = await res.json();

      setMessages(prev => prev.filter(m => !m.loading).concat({ 
        role: "ai", 
        content: data.success 
          ? `✨ Done! I've added "${data.title}" to your ${data.label} list.` 
          : `Sorry, I hit a snag: ${data.error}` 
      }));
    } catch (err) {
      setMessages(prev => prev.filter(m => !m.loading).concat({ role: "ai", content: "Something went wrong. Is your GitHub connection active?" }));
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 flex flex-col p-12 overflow-hidden">
        <header className="mb-12 flex-shrink-0">
          <h1 className="text-6xl font-black uppercase tracking-tighter flex items-center gap-4">
            <Sparkles className="w-12 h-12 text-yellow-500" /> Family Copilot
          </h1>
          <p className="text-2xl font-bold text-zinc-600 mt-2">
            Talk to your house. It listens (in a good way).
          </p>
        </header>

        <div className="flex-1 border-8 border-black overflow-hidden flex flex-col bg-zinc-50 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-6 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-16 h-16 border-4 border-black flex-shrink-0 flex items-center justify-center ${m.role === "ai" ? "bg-black text-white" : "bg-white text-black"}`}>
                  {m.role === "ai" ? <Bot className="w-8 h-8" /> : <User className="w-8 h-8" />}
                </div>
                <div className={`max-w-2xl p-6 border-4 border-black text-2xl font-black uppercase italic ${m.role === "ai" ? "bg-white" : "bg-zinc-200"}`}>
                  {m.loading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-8 bg-white border-t-8 border-black flex gap-4">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Add a task to mow the lawn on Saturday..."
              className="flex-1 h-24 border-4 border-black px-8 text-3xl font-black uppercase italic outline-none focus:ring-8 focus:ring-accent"
            />
            <Button type="submit" className="h-24 px-12 text-3xl border-8 border-black">
              <Send className="w-10 h-10" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
