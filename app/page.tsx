"use client";

import OnboardingWizard from "@/components/onboarding-wizard";
import Dashboard from "@/components/dashboard";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const { repoName } = useOnboardingStore();

  // If session exists and repo is configured, show dashboard
  // Otherwise show onboarding wizard
  if (session && repoName) {
    return <Dashboard />;
  }

  return <OnboardingWizard />;
}
