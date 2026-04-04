"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getOctokit, fetchStats } from "@/lib/github";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import Sidebar from "@/components/sidebar";
import { Users, Trophy, Flame, Loader2, UserPlus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MemberStats {
  login: string;
  avatar_url: string;
  points: number;
  streak: number;
}

export default function FamilyPage() {
  const { data: session } = useSession();
  const { repoOwner, repoName } = useOnboardingStore();
  const [members, setMembers] = useState<MemberStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (session?.accessToken && repoOwner && repoName) {
        const token = session.accessToken;
        setLoading(true);
        try {
          const octokit = getOctokit(token);
          
          // 1. Fetch repo collaborators
          const { data: collabs } = await octokit.repos.listCollaborators({
            owner: repoOwner,
            repo: repoName,
          });

          // 2. Fetch real stats from stats.json
          const { stats } = await fetchStats(token, repoOwner, repoName);

          const memberData = collabs.map((c) => ({
            login: c.login,
            avatar_url: c.avatar_url,
            points: stats.members[c.login]?.points || 0,
            streak: stats.members[c.login]?.streak || 0,
          }));

          setMembers(memberData);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    }
    load();
  }, [session, repoOwner, repoName]);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter flex items-center gap-4">
              <Users className="w-12 h-12" /> Family Leaderboard
            </h1>
            <p className="text-2xl font-bold text-zinc-600 mt-2">
              Friendly competition for a cleaner home.
            </p>
          </div>
          <Button size="lg" className="h-20 text-2xl px-10 border-8 border-black" variant="outline">
            <UserPlus className="w-8 h-8 mr-2" /> INVITE MEMBER
          </Button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-16 h-16 animate-spin" />
            <p className="text-2xl font-black uppercase">Gathering the family...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Main Ranking */}
            <div className="space-y-8">
              <h2 className="text-4xl font-black uppercase border-b-8 border-black pb-4 flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-500" /> Rankings
              </h2>
              <div className="space-y-6">
                {members.sort((a,b) => b.points - a.points).map((member, index) => (
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
              </div>
            </div>

            {/* Stats & Badges */}
            <div className="space-y-8">
              <h2 className="text-4xl font-black uppercase border-b-8 border-black pb-4 flex items-center gap-3">
                <Star className="w-8 h-8 text-blue-500" /> Achievements
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { name: "Trash Titan", icon: "🗑️", desc: "Took out trash 10 times" },
                  { name: "Dish Master", icon: "🍽️", desc: "Cleared the sink all week" },
                  { name: "Laundry Legend", icon: "🧺", desc: "Folded 5 baskets" },
                  { name: "Pet Protector", icon: "🐕", desc: "Never missed a feeding" },
                ].map(badge => (
                  <div key={badge.name} className="border-4 border-black p-6 bg-zinc-50 text-center">
                    <div className="text-6xl mb-4">{badge.icon}</div>
                    <h4 className="text-xl font-black uppercase">{badge.name}</h4>
                    <p className="font-bold text-zinc-500">{badge.desc}</p>
                  </div>
                ))}
              </div>

              <div className="border-8 border-black p-8 bg-black text-white">
                <h3 className="text-3xl font-black uppercase mb-4 flex items-center gap-3">
                  <Flame className="w-8 h-8 text-orange-500" /> Hot Streaks
                </h3>
                <div className="space-y-4">
                  {members.map(m => (
                    <div key={m.login} className="flex justify-between items-center">
                      <span className="text-xl font-bold uppercase">{m.login}</span>
                      <div className="flex gap-1">
                        {Array.from({ length: m.streak }).map((_, i) => (
                          <div key={i} className="w-4 h-8 bg-orange-500 border-2 border-white"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
