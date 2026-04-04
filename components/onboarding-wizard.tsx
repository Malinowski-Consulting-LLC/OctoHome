"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { useState } from "react";
import { Home, ArrowRight, Github, Users, Rocket, ExternalLink, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MorphingCard } from "./magic/morphing-card";
import { motion } from "framer-motion";
import { forkRepo, waitForRepo, setupDefaultLabels, enablePages, inviteFamilyMember } from "@/lib/github";

export default function OnboardingWizard() {
  const { data: session } = useSession();
  const { step, setStep, setGithubData, householdName, isOrg, invitedMembers, addInvitedMember } = useOnboardingStore();
  const [newMember, setNewMember] = useState("");
  const [isBlastingOff, setIsBlastingOff] = useState(false);

  const nextStep = () => setStep(step + 1);

  const handleBlastOff = async () => {
    // @ts-ignore
    if (session?.accessToken) {
      setIsBlastingOff(true);
      try {
        // @ts-ignore
        const owner = isOrg ? householdName.replace(/\s+/g, '-').toLowerCase() : session.user?.login || "my-home";
        const name = "home-ops";
        
        // 1. Start the fork
        // @ts-ignore
        await forkRepo(session.accessToken as string, "octohome", "template", isOrg ? owner : undefined);
        
        // 2. Poll until the repo is ready
        // @ts-ignore
        const ready = await waitForRepo(session.accessToken as string, owner, name);
        
        if (ready) {
          // @ts-ignore
          const token = session.accessToken as string;
          
          // 3. Initialize household labels
          // @ts-ignore
          await setupDefaultLabels(token, owner, name);
          
          // 4. Invite family members
          for (const member of invitedMembers) {
            await inviteFamilyMember(token, owner, name, member);
          }

          // 5. Enable GitHub Pages
          await enablePages(token, owner, name);
          
          setGithubData({ repoOwner: owner, repoName: name });
          nextStep();
        } else {
          alert("GitHub is taking a while to fork. Please try again in a moment!");
        }
      } catch (error) {
        console.error(error);
        alert("Something went wrong during setup. Check your GitHub permissions.");
      } finally {
        setIsBlastingOff(false);
      }
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white text-black text-center relative overflow-hidden">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#000 2px, transparent 2px), linear-gradient(90deg, #000 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="relative z-10"
        >
          <Home className="w-24 h-24 mb-8 text-black mx-auto" aria-hidden="true" />
          <h1 className="text-7xl font-black mb-6 tracking-tighter uppercase leading-none">OctoHome</h1>
          <p className="text-2xl mb-12 max-w-xl font-bold italic border-l-8 border-black pl-6 ml-4 text-left">
            The most accessible way to manage your household using GitHub.
          </p>
          <button 
            onClick={() => signIn("github")}
            className="bg-black text-white px-12 py-6 rounded-none font-black text-3xl hover:translate-x-2 hover:-translate-y-2 transition-all focus-ring uppercase border-8 border-black flex items-center gap-4 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]"
          >
            <Github className="w-10 h-10" /> Connect GitHub
          </button>
          <p className="mt-12 text-lg underline cursor-pointer font-black uppercase tracking-widest" onClick={() => window.open('https://github.com/signup')}>
            Don't have an account? Create one <ExternalLink className="inline w-5 h-5 ml-1" />
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-6 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#000 2px, transparent 2px), linear-gradient(90deg, #000 2px, transparent 2px)', backgroundSize: '60px 60px' }}></div>

      <MorphingCard step={step} className="z-10 w-full max-w-2xl">
        {step === 0 && (
          <div className="space-y-10">
            <h2 className="text-5xl font-black uppercase tracking-tight italic">House Name</h2>
            <div className="space-y-4">
              <Input 
                id="household-name"
                type="text" 
                placeholder="e.g. The Smith Family" 
                className="h-24 text-3xl italic"
                onChange={(e) => setGithubData({ householdName: e.target.value })}
              />
            </div>
            <button 
              onClick={nextStep}
              className="w-full bg-black text-white p-8 text-3xl font-black uppercase hover:bg-zinc-800 flex items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              Continue <ArrowRight className="w-10 h-10" />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-10">
            <h2 className="text-5xl font-black uppercase tracking-tight italic">Storage Type</h2>
            <div className="grid grid-cols-1 gap-6">
              <button 
                onClick={() => { setGithubData({ isOrg: false }); nextStep(); }}
                className={`p-10 border-8 text-left transition-all group ${!isOrg ? 'border-black bg-black text-white' : 'border-zinc-200 hover:border-black'}`}
              >
                <h3 className="text-4xl font-black uppercase mb-2">Personal</h3>
                <p className="text-xl font-bold opacity-80 uppercase">Simple storage in your profile.</p>
              </button>
              <button 
                onClick={() => { setGithubData({ isOrg: true }); nextStep(); }}
                className={`p-10 border-8 text-left transition-all group ${isOrg ? 'border-black bg-black text-white' : 'border-zinc-200 hover:border-black'}`}
              >
                <h3 className="text-4xl font-black uppercase mb-2">Organization</h3>
                <p className="text-xl font-bold opacity-80 uppercase">Shared space for everyone.</p>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10">
            <h2 className="text-5xl font-black uppercase tracking-tight italic">Invite Family</h2>
            <div className="flex gap-4">
              <Input 
                type="text" 
                placeholder="GitHub Username" 
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                className="h-24 text-3xl italic"
              />
              <button 
                onClick={() => { if(newMember) { addInvitedMember(newMember); setNewMember(""); } }}
                className="bg-black text-white px-8 font-black uppercase hover:bg-zinc-800 border-4 border-black"
              >
                <Plus className="w-10 h-10" />
              </button>
            </div>
            <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto pr-2">
              {invitedMembers.map(m => (
                <div key={m} className="px-6 py-3 bg-zinc-100 border-4 border-black font-black uppercase flex items-center gap-3 text-xl">
                  <Users className="w-6 h-6" /> {m}
                </div>
              ))}
            </div>
            <button 
              onClick={nextStep}
              className="w-full bg-black text-white p-8 text-3xl font-black uppercase hover:bg-zinc-800 flex items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              Almost Done! <ArrowRight className="w-10 h-10" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 text-center">
            <div className="relative inline-block">
              <Rocket className="w-32 h-32 mx-auto text-black" />
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-4 bg-black/10 rounded-full blur-md"
              />
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tight">Blast Off!</h2>
            <p className="text-2xl font-bold uppercase italic opacity-70">Setting up your household repo...</p>
            <div className="p-8 border-8 border-black bg-zinc-50 text-left space-y-4">
              <p className="text-xl font-black uppercase">✅ Create Repo: <strong>home-ops</strong></p>
              <p className="text-xl font-black uppercase">✅ Setup Routines</p>
              <p className="text-xl font-black uppercase">✅ Final Handoff</p>
            </div>
            <button 
              onClick={handleBlastOff}
              disabled={isBlastingOff}
              className="w-full bg-black text-white p-10 text-4xl font-black uppercase hover:bg-zinc-800 flex items-center justify-center gap-4 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
            >
              {isBlastingOff ? <Loader2 className="w-16 h-16 animate-spin" /> : "START THE MAGIC ✨"}
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-10 text-center">
            <h2 className="text-7xl font-black uppercase tracking-tight">Welcome Home!</h2>
            <p className="text-2xl font-bold uppercase italic border-y-4 border-black py-4">Your Household OS is live.</p>
            <div className="grid grid-cols-1 gap-4">
              <Button className="h-24 text-2xl font-black border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" variant="outline">DOWNLOAD DESKTOP</Button>
              <Button className="h-24 text-2xl font-black border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" variant="outline">DOWNLOAD MOBILE</Button>
            </div>
            <button 
              onClick={() => window.location.href = "/"}
              className="w-full bg-black text-white p-10 text-4xl font-black uppercase hover:scale-105 transition-transform"
            >
              ENTER DASHBOARD 🏠
            </button>
          </div>
        )}
      </MorphingCard>
    </div>
  );
}
