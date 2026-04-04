"use client";

import { useSession } from "next-auth/react";
import Sidebar from "@/components/sidebar";
import { Settings, Shield, Database, Github, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/store/use-onboarding-store";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { repoOwner, repoName, isOrg, magicEnabled, toggleMagic } = useOnboardingStore();

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans">
      <Sidebar />
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-7xl font-black uppercase tracking-tighter flex items-center gap-6">
            <Settings className="w-16 h-16" /> House Settings
          </h1>
          <p className="text-3xl font-bold text-zinc-500 mt-4 uppercase italic">
            Manage your household OS connection.
          </p>
        </header>

        <div className="max-w-5xl space-y-12">
          {/* Accessibility */}
          <section className="border-8 border-black p-12 bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-5xl font-black uppercase mb-10 flex items-center gap-6 italic">
              <Sparkles className="w-12 h-12" /> Experience
            </h2>
            <div className="flex justify-between items-center bg-zinc-100 p-8 border-4 border-black">
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tight">Magic Mode</h3>
                <p className="text-xl font-bold text-zinc-500 uppercase italic mt-2">Enables fluid animations and visual depth.</p>
              </div>
              <button 
                onClick={toggleMagic}
                className={`w-24 h-12 border-4 border-black relative transition-colors ${magicEnabled ? 'bg-black' : 'bg-white'}`}
              >
                <div className={`absolute top-1 bottom-1 w-8 transition-all border-2 border-black ${magicEnabled ? 'right-1 bg-white' : 'left-1 bg-black'}`} />
              </button>
            </div>
          </section>

          {/* Repo Connection */}
          <section className="border-8 border-black p-12 bg-zinc-50 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-4xl font-black uppercase mb-8 flex items-center gap-4">
              <Database className="w-8 h-8" /> Data Connection
            </h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b-4 border-black pb-6">
                <div>
                  <p className="text-sm font-black uppercase text-zinc-400">GitHub Repository</p>
                  <p className="text-3xl font-black italic">{repoOwner}/{repoName}</p>
                </div>
                <Button variant="outline" className="border-4 border-black font-black uppercase">Change Repo</Button>
              </div>
              <div className="flex justify-between items-center border-b-4 border-black pb-6">
                <div>
                  <p className="text-sm font-black uppercase text-zinc-400">Storage Type</p>
                  <p className="text-3xl font-black italic">{isOrg ? "Organization" : "Personal Account"}</p>
                </div>
                <Shield className="w-10 h-10" />
              </div>
            </div>
          </section>

          {/* Account */}
          <section className="border-8 border-black p-12 bg-white">
            <h2 className="text-4xl font-black uppercase mb-8 flex items-center gap-4">
              <Github className="w-8 h-8" /> Connected Account
            </h2>
            <div className="flex items-center gap-8 mb-12">
              <img src={session?.user?.image || ""} className="w-32 h-32 border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" alt="Avatar" />
              <div>
                <p className="text-4xl font-black uppercase">{session?.user?.name}</p>
                <p className="text-2xl font-bold text-zinc-500 italic">{session?.user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Button className="h-24 text-2xl font-black border-8 border-black bg-white text-black hover:bg-zinc-100 flex gap-4">
                <Bell className="w-8 h-8" /> NOTIFICATIONS
              </Button>
              <Button variant="destructive" className="h-24 text-2xl font-black border-8 border-black flex gap-4">
                <LogOut className="w-8 h-8" /> SIGN OUT
              </Button>
            </div>
          </section>

          <p className="text-center text-xl font-bold text-zinc-400 uppercase italic">
            OctoHome Version 1.0.0 • Powered by GitHub Issues
          </p>
        </div>
      </main>
    </div>
  );
}
