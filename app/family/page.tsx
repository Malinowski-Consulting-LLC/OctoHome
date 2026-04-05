"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import RepoRequiredState from "@/components/repo-required-state";
import type { FamilyMember } from "@/lib/types";
import { Users, Trophy, Flame, Loader2, AlertCircle } from "lucide-react";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";

export default function FamilyPage() {
  const { status, error: repoError, refresh, repoOwner, repoName } = useResolvedHomeRepo();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "ready" || !repoOwner || !repoName) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/family?owner=${encodeURIComponent(repoOwner)}&repo=${encodeURIComponent(repoName)}`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to fetch family data");
        setMembers(json.members);
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
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 p-12 overflow-y-auto">
          <RepoRequiredState status={status} error={repoError} onRetry={refresh} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-6xl font-black uppercase tracking-tighter flex items-center gap-4">
            <Users className="w-12 h-12" /> Family Leaderboard
          </h1>
          <p className="text-2xl font-bold text-zinc-600 mt-2">
            Friendly competition for a cleaner home.
          </p>
        </header>

        {error ? (
          <div className="border-8 border-red-600 p-12 flex items-center gap-6">
            <AlertCircle className="w-12 h-12 text-red-600 flex-shrink-0" />
            <p className="text-2xl font-black uppercase text-red-600">{error}</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-16 h-16 animate-spin" />
            <p className="text-2xl font-black uppercase">Gathering the family...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Rankings */}
            <div className="space-y-8">
              <h2 className="text-4xl font-black uppercase border-b-8 border-black pb-4 flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-500" /> Rankings
              </h2>
              <div className="space-y-6">
                {[...members].sort((a, b) => b.points - a.points).map((member, index) => (
                  <div key={member.login} className="border-8 border-black p-8 flex items-center justify-between hover:bg-zinc-50 transition-colors bg-white">
                    <div className="flex items-center gap-6">
                      <div className="text-5xl font-black w-12">{index + 1}</div>
                      <img src={member.avatar_url} className="w-20 h-20 border-4 border-black" alt={member.login} />
                      <div>
                        <h3 className="text-3xl font-black uppercase tracking-tight">{member.login}</h3>
                        <p className="text-xl font-bold text-zinc-500 uppercase italic">House Member</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black">{member.points}</div>
                      <div className="text-sm font-black uppercase text-zinc-400">Points</div>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-xl font-bold text-zinc-400 uppercase">No members found.</p>
                )}
              </div>
            </div>

            {/* Hot Streaks */}
            <div className="space-y-8">
              <h2 className="text-4xl font-black uppercase border-b-8 border-black pb-4 flex items-center gap-3">
                <Flame className="w-8 h-8 text-orange-500" /> Hot Streaks
              </h2>
              <div className="border-8 border-black p-8 bg-black text-white">
                <div className="space-y-6">
                  {members.map(m => (
                    <div key={m.login} className="flex justify-between items-center">
                      <span className="text-xl font-bold uppercase">{m.login}</span>
                      <div className="flex gap-1 items-center">
                        {m.streak > 0 ? Array.from({ length: Math.min(m.streak, 14) }).map((_, i) => (
                          <div key={i} className="w-4 h-8 bg-orange-500 border-2 border-white" />
                        )) : (
                          <span className="text-zinc-400 font-bold text-sm uppercase">No streak</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="text-zinc-400 font-bold uppercase">No members found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
