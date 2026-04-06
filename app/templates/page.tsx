"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import RepoRequiredState from "@/components/repo-required-state";
import { Sparkles, Calendar, Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof DAYS)[number];

export default function RoutinesPage() {
  const router = useRouter();
  const homeRepo = useResolvedHomeRepo();
  const [title, setTitle] = useState("");
  const [selectedDays, setSelectedDays] = useState<Day[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (homeRepo.status !== "ready") {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 p-12 overflow-y-auto">
          <RepoRequiredState status={homeRepo.status} error={homeRepo.error} onRetry={homeRepo.refresh} />
        </main>
      </div>
    );
  }

  const toggleDay = (day: Day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreate = async () => {
    const { repoOwner, repoName } = homeRepo;
    if (!repoOwner || !repoName || !title || selectedDays.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-octohome-repo-owner": homeRepo.repoOwner,
        },
        body: JSON.stringify({
          title,
          days: selectedDays,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create routine");
      router.push("/");
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-6xl font-black uppercase tracking-tighter flex items-center gap-4">
            <Calendar className="w-12 h-12" /> Household Routines
          </h1>
          <p className="text-2xl font-bold text-zinc-600 mt-2">
            Automate your recurring family tasks.
          </p>
        </header>

        <div className="max-w-4xl border-8 border-black p-12 space-y-12 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-4">
            <label className="text-4xl font-black uppercase block italic">Routine Name</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Grocery List"
              className="h-24 text-4xl"
            />
          </div>

          <div className="space-y-4">
            <label className="text-4xl font-black uppercase block italic">Repeat Every...</label>
            <div className="flex flex-wrap gap-4">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`w-24 h-24 border-4 font-black uppercase text-2xl transition-all flex items-center justify-center ${
                    selectedDays.includes(day)
                      ? "bg-black text-white border-black"
                      : "border-zinc-200 hover:border-black"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-100 p-8 border-4 border-black border-dashed">
            <h3 className="text-2xl font-black uppercase mb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6" /> How it works
            </h3>
            <p className="text-xl font-bold text-zinc-600">
              OctoHome will create a &quot;GitHub Action&quot; in your repository. This action will
              automatically open a new task for you at 9:00 AM on the days you selected.
            </p>
          </div>

          <Button
            onClick={handleCreate}
            disabled={isSubmitting || !homeRepo.repoOwner || !homeRepo.repoName || !title || selectedDays.length === 0}
            size="lg"
            className="w-full h-32 text-4xl font-black border-8 border-black"
          >
            {isSubmitting ? (
              <Loader2 className="w-12 h-12 animate-spin mr-4" />
            ) : (
              <Save className="w-12 h-12 mr-4" />
            )}
            ACTIVATE ROUTINE
          </Button>
          {submitError && (
            <div className="flex items-center gap-4 border-4 border-red-600 p-6">
              <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              <p className="text-xl font-black uppercase text-red-600">{submitError}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
