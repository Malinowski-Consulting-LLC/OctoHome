"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { useState } from "react";
import { Home, ArrowRight, Github, Users, Rocket, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OnboardingWizard() {
  const { data: session } = useSession();
  const { step, setStep, setGithubData, githubUsername, isOrg, invitedMembers, addInvitedMember } = useOnboardingStore();
  const [newMember, setNewMember] = useState("");

  const nextStep = () => setStep(step + 1);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white text-black text-center">
        <Home className="w-20 h-20 mb-6 text-black" aria-hidden="true" />
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight uppercase">Welcome to OctoHome</h1>
        <p className="text-xl mb-8 max-w-md font-medium">The most accessible way to manage your household using GitHub.</p>
        <button 
          onClick={() => signIn("github")}
          className="bg-black text-white px-8 py-4 rounded-none font-black text-2xl hover:bg-zinc-800 transition-all focus-ring uppercase border-4 border-black flex items-center gap-3"
        >
          <Github className="w-8 h-8" /> Connect Family GitHub
        </button>
        <p className="mt-6 text-sm underline cursor-pointer font-bold" onClick={() => window.open('https://github.com/signup')}>
          Don't have a GitHub account? Create one here <ExternalLink className="inline w-4 h-4" />
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 bg-white min-h-screen flex flex-col justify-center">
      {/* Progress Bar */}
      <div className="w-full h-4 bg-zinc-200 mb-12 border-2 border-black">
        <div 
          className="h-full bg-black transition-all duration-500" 
          style={{ width: `${(step / 4) * 100}%` }}
        ></div>
      </div>

      {step === 0 && (
        <section className="space-y-8 animate-in fade-in duration-500">
          <h2 className="text-5xl font-black uppercase tracking-tight">Step 1: Family Info</h2>
          <div className="space-y-4">
            <label htmlFor="household-name" className="text-2xl font-bold block uppercase">Your Household Name</label>
            <input 
              id="household-name"
              type="text" 
              placeholder="e.g. The Smith Family" 
              className="w-full p-6 text-2xl border-4 border-black focus:ring-4 focus:ring-accent outline-none"
              onChange={(e) => setGithubData({ householdName: e.target.value })}
            />
          </div>
          <button 
            onClick={nextStep}
            className="w-full bg-black text-white p-6 text-2xl font-black uppercase hover:bg-zinc-800 flex items-center justify-center gap-4"
          >
            Continue <ArrowRight className="w-8 h-8" />
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-8 animate-in slide-in-from-right duration-500">
          <h2 className="text-5xl font-black uppercase tracking-tight">Step 2: Where to store?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => { setGithubData({ isOrg: false }); nextStep(); }}
              className={`p-8 border-8 text-left transition-all ${!isOrg ? 'border-black bg-black text-white' : 'border-zinc-200 hover:border-black'}`}
            >
              <h3 className="text-3xl font-black uppercase mb-2">Personal Account</h3>
              <p className="text-lg font-bold">Store chores in your private profile. Best for small households.</p>
            </button>
            <button 
              onClick={() => { setGithubData({ isOrg: true }); nextStep(); }}
              className={`p-8 border-8 text-left transition-all ${isOrg ? 'border-black bg-black text-white' : 'border-zinc-200 hover:border-black'}`}
            >
              <h3 className="text-3xl font-black uppercase mb-2">Organization</h3>
              <p className="text-lg font-bold">Create a shared space for the family. Best for long-term growth.</p>
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-8 animate-in slide-in-from-right duration-500">
          <h2 className="text-5xl font-black uppercase tracking-tight">Step 3: Invite Family</h2>
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="Family member's GitHub username" 
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              className="flex-1 p-6 text-xl border-4 border-black focus:ring-4 focus:ring-accent outline-none"
            />
            <button 
              onClick={() => { if(newMember) { addInvitedMember(newMember); setNewMember(""); } }}
              className="bg-black text-white p-6 font-black uppercase hover:bg-zinc-800"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>
          <ul className="space-y-2">
            {invitedMembers.map(m => (
              <li key={m} className="p-4 bg-zinc-100 border-2 border-black font-bold flex items-center gap-4 text-xl">
                <Users className="w-6 h-6" /> {m}
              </li>
            ))}
          </ul>
          <button 
            onClick={nextStep}
            className="w-full bg-black text-white p-6 text-2xl font-black uppercase hover:bg-zinc-800"
          >
            Almost Done! <ArrowRight className="w-8 h-8" />
          </button>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-8 animate-in slide-in-from-right duration-500 text-center">
          <Rocket className="w-24 h-24 mx-auto animate-bounce text-black" />
          <h2 className="text-5xl font-black uppercase tracking-tight">Blast Off!</h2>
          <p className="text-2xl font-bold">We're about to create your household repo and deploy your web app.</p>
          <div className="p-8 border-4 border-black bg-zinc-50 text-left space-y-4">
            <p className="font-bold flex items-center gap-3">✅ Create Repo: <strong>home-ops</strong></p>
            <p className="font-bold flex items-center gap-3">✅ Setup Actions for Routines</p>
            <p className="font-bold flex items-center gap-3">✅ Deploy to GitHub Pages</p>
          </div>
          <button 
            onClick={() => { /* Implement Final Setup Logic */ nextStep(); }}
            className="w-full bg-black text-white p-8 text-3xl font-black uppercase hover:bg-zinc-800"
          >
            Create My OctoHome ✨
          </button>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-8 animate-in zoom-in duration-500 text-center">
          <h2 className="text-6xl font-black uppercase tracking-tight">You're All Set!</h2>
          <p className="text-2xl font-bold">Your OctoHome is live. Download the apps to stay connected anywhere.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 text-xl font-black border-4 border-black" variant="outline">DESKTOP APP</Button>
            <Button className="h-20 text-xl font-black border-4 border-black" variant="outline">ANDROID</Button>
            <Button className="h-20 text-xl font-black border-4 border-black" variant="outline">iOS APP</Button>
          </div>
          <button 
            onClick={() => window.location.href = "/"}
            className="w-full bg-black text-white p-8 text-3xl font-black uppercase"
          >
            Go to Dashboard 🏠
          </button>
        </section>
      )}
    </div>
  );
}
