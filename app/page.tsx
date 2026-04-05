"use client";

import Dashboard from "@/components/dashboard";
import OnboardingWizard from "@/components/onboarding-wizard";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";

export default function Home() {
  const homeRepo = useResolvedHomeRepo();

  // Auth session still resolving — don't show onboarding prematurely
  if (homeRepo.status === "auth-loading" || homeRepo.status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <p className="text-2xl font-black uppercase animate-pulse">Loading…</p>
      </div>
    );
  }

  // Not signed in — show onboarding (sign-in screen)
  if (homeRepo.status === "signed-out") {
    return <OnboardingWizard />;
  }

  // Discovery error — let user proceed to onboarding so they can retry or set up
  if (homeRepo.status === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 flex-col gap-6">
        <p className="text-2xl font-black uppercase">Could not reach GitHub</p>
        <p className="text-lg font-bold text-zinc-600">
          Check your connection, then{" "}
          <button
            className="underline"
            onClick={() => window.location.reload()}
          >
            reload
          </button>
          .
        </p>
      </div>
    );
  }

  // Repo found — show dashboard
  if (homeRepo.status === "ready") {
    return <Dashboard />;
  }

  // No repo yet — show onboarding wizard
  return <OnboardingWizard />;
}
