"use client";

import { useEffect, useRef, useState } from "react";

import { Bot, Send, Sparkles, User } from "lucide-react";

import { EnergyOrb } from "@/components/magic/energy-orb";
import { PageHeader } from "@/components/page-header";
import RepoRequiredState from "@/components/repo-required-state";
import Sidebar from "@/components/sidebar";
import { SurfaceCard } from "@/components/surface-card";
import { Button } from "@/components/ui/button";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";

interface Message {
  role: "ai" | "user";
  content: string;
  loading?: boolean;
}

const eyebrowClassName =
  "inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground";

const inputClassName =
  "h-12 w-full rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-[color:var(--ring-color)]";

const primaryButtonClassName =
  "h-11 rounded-[var(--radius-control)] border border-[color:var(--accent-solid)] bg-[color:var(--accent-solid)] px-4 text-sm font-semibold normal-case tracking-normal text-[color:var(--app-bg)] shadow-none hover:opacity-90";

const orbStateLabels: Record<"idle" | "thinking" | "speaking" | "error", string> = {
  idle: "Ready",
  thinking: "Thinking",
  speaking: "Responding",
  error: "Needs attention",
};

export default function AICopilotPage() {
  const homeRepo = useResolvedHomeRepo();
  const { repoOwner, repoName } = homeRepo;
  const repoReady = Boolean(repoOwner && repoName);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "Hi! Tell me what needs doing and I will turn it into a GitHub issue. Try saying \"Add a task to buy milk.\"",
    },
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
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-5xl">
            <RepoRequiredState
              status={homeRepo.status}
              error={homeRepo.error}
              onRetry={homeRepo.refresh}
            />
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || !repoReady) return;

    const userText = input;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userText },
      { role: "ai", content: "...", loading: true },
    ]);
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
      setMessages((prev) =>
        prev.filter((message) => !message.loading).concat({
          role: "ai",
          content: data.success
            ? `✨ Heuristic capture complete — I added "${data.title}" with the ${data.label} label.`
            : `Sorry, I couldn't create that issue: ${data.error}`,
        })
      );

      setTimeout(() => setOrbState("idle"), 2000);
    } catch (error) {
      console.error(error);
      setOrbState("error");
      setMessages((prev) =>
        prev
          .filter((message) => !message.loading)
          .concat({
            role: "ai",
            content:
              "Something went wrong while creating the issue. Check your GitHub connection and household repo settings.",
          })
      );
      setTimeout(() => setOrbState("idle"), 3000);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-6">
          <div className="space-y-3">
            <span className={eyebrowClassName}>
              <Sparkles className="h-3.5 w-3.5" />
              AI
            </span>
            <PageHeader
              title="Family Copilot"
              subtitle={`Describe a household task and OctoHome will create a GitHub issue in ${repoOwner}/${repoName}.`}
              actions={
                <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] p-3 shadow-[var(--shadow-card)]">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Copilot status
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {orbStateLabels[orbState]}
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[color:var(--surface-2)]">
                    <EnergyOrb state={orbState} className="h-14 w-14" />
                  </div>
                </div>
              }
            />
          </div>

          <SurfaceCard className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6"
            >
              <div className="flex flex-col gap-4">
                {messages.map((message, index) => {
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={index}
                      className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser ? (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] text-muted-foreground">
                          <Bot className="h-5 w-5" />
                        </div>
                      ) : null}

                      <div
                        className={`max-w-[min(42rem,100%)] break-words rounded-[var(--radius-control)] border px-4 py-3 text-sm leading-7 [overflow-wrap:anywhere] sm:text-base ${
                          isUser
                            ? "border-[color:var(--border-strong)] bg-[color:var(--interactive-bg)] text-foreground"
                            : "border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] text-foreground"
                        }`}
                      >
                        {message.loading ? (
                          <div className="flex gap-2">
                            <div className="h-2 w-2 rounded-full bg-[color:var(--accent-solid)] animate-bounce" />
                            <div className="h-2 w-2 rounded-full bg-[color:var(--accent-solid)] animate-bounce [animation-delay:-.3s]" />
                            <div className="h-2 w-2 rounded-full bg-[color:var(--accent-solid)] animate-bounce [animation-delay:-.5s]" />
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{message.content}</p>
                        )}
                      </div>

                      {isUser ? (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] text-muted-foreground">
                          <User className="h-5 w-5" />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <label htmlFor="ai-prompt" className="text-sm font-medium text-foreground">
                    Describe the task
                  </label>
                  <input
                    id="ai-prompt"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={
                      repoReady
                        ? "e.g. Add a task to mow the lawn"
                        : "Finish onboarding to connect a repository"
                    }
                    disabled={!repoReady}
                    className={inputClassName}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!repoReady}
                  className={`${primaryButtonClassName} w-full sm:w-auto`}
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
            </form>
          </SurfaceCard>
        </div>
      </main>
    </div>
  );
}
