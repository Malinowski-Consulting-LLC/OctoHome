"use client";

import type { ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import Dashboard from "@/components/dashboard";
import OnboardingWizard from "@/components/onboarding-wizard";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";

const actionClassName =
  "inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-[color:var(--interactive-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-color)]";

function CenteredStateCard(props: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
        <SurfaceCard className="w-full max-w-xl">{props.children}</SurfaceCard>
      </div>
    </div>
  );
}

export default function Home() {
  const homeRepo = useResolvedHomeRepo();

  if (homeRepo.status === "auth-loading" || homeRepo.status === "loading") {
    return (
      <CenteredStateCard>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting to your GitHub home</span>
          </div>
          <PageHeader
            title="Loading your home"
            subtitle="Checking your GitHub sign-in and looking for the household repository."
          />
        </div>
      </CenteredStateCard>
    );
  }

  if (homeRepo.status === "signed-out") {
    return <OnboardingWizard />;
  }

  if (homeRepo.status === "error") {
    return (
      <CenteredStateCard>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">GitHub could not be reached right now.</span>
          </div>
          <PageHeader
            title="Could not load OctoHome"
            subtitle="Check your connection and reload the page to try the repository lookup again."
          />
          <button type="button" className={actionClassName} onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </CenteredStateCard>
    );
  }

  if (homeRepo.status === "ready") {
    return <Dashboard />;
  }

  return <OnboardingWizard />;
}
