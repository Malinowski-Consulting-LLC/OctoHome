"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Sidebar from "@/components/sidebar";
import { Sparkles, Calendar, Plus, Save, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { commitFile } from "@/lib/github";
import { useRouter } from "next/navigation";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CRON_DAYS = ["1", "2", "3", "4", "5", "6", "0"]; // GitHub crons: 0-6 is Sun-Sat

export default function RoutinesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const generateYaml = (title: string, days: string[]) => {
    const cronDays = days.map(d => CRON_DAYS[DAYS.indexOf(d)]).join(",");
    const cron = `0 9 * * ${cronDays}`;
    
    return `name: Routine - ${title}
on:
  schedule:
    - cron: '${cron}'
  workflow_dispatch: # Allow manual trigger

jobs:
  create_issue:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - name: Create Household Issue
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '${title}',
              labels: ['Routine', 'Automated']
            })`;
  };

  const handleCreate = async () => {
    // @ts-ignore
    if (session?.accessToken && title && selectedDays.length > 0) {
      setIsSubmitting(true);
      try {
        const yaml = generateYaml(title, selectedDays);
        const fileName = title.toLowerCase().replace(/\s+/g, "-") + ".yml";
        // @ts-ignore
        const { repoOwner, repoName } = JSON.parse(localStorage.getItem('octohome-onboarding') || '{}').state;
        
        await commitFile(
          // @ts-ignore
          session.accessToken as string,
          repoOwner,
          repoName,
          `.github/workflows/routine-${fileName}`,
          yaml,
          `Add recurring routine: ${title}`
        );
        router.push("/");
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
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
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`w-24 h-24 border-4 font-black uppercase text-2xl transition-all flex items-center justify-center ${
                    selectedDays.includes(day) ? "bg-black text-white border-black" : "border-zinc-200 hover:border-black"
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
              OctoHome will create a "GitHub Action" in your repository. This action will automatically open a new task for you at 9:00 AM on the days you selected.
            </p>
          </div>

          <Button 
            onClick={handleCreate}
            disabled={isSubmitting || !title || selectedDays.length === 0}
            size="lg" 
            className="w-full h-32 text-4xl font-black border-8 border-black"
          >
            {isSubmitting ? <Loader2 className="w-12 h-12 animate-spin mr-4" /> : <Save className="w-12 h-12 mr-4" />}
            ACTIVATE ROUTINE
          </Button>
        </div>
      </main>
    </div>
  );
}
