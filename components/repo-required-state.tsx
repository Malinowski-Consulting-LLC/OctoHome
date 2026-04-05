"use client";

import Link from "next/link";
import { AlertCircle, Github, Home, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { ActionGroup } from "@/components/action-group";
import type { ResolvedHomeRepoStatus } from "@/lib/use-resolved-home-repo";

type RepoRequiredStateProps = {
  status: Exclude<ResolvedHomeRepoStatus, "ready">;
  error?: string | null;
  onRetry: () => void;
};

export default function RepoRequiredState({
  status,
  error,
  onRetry,
}: RepoRequiredStateProps) {
  if (status === "auth-loading" || status === "loading") {
    return (
      <SurfaceCard>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting…</span>
          </div>
          <PageHeader
            title="Loading your home"
            subtitle="Checking your GitHub connection and household repository."
          />
        </div>
      </SurfaceCard>
    );
  }

  if (status === "signed-out") {
    return (
      <SurfaceCard>
        <div className="flex items-start gap-4">
          <Github className="mt-1 h-6 w-6 shrink-0 text-muted-foreground" />
          <div className="space-y-4">
            <PageHeader
              title="Sign in to continue"
              subtitle="Open the home screen and connect your GitHub account before using this page."
            />
            <ActionGroup>
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </ActionGroup>
          </div>
        </div>
      </SurfaceCard>
    );
  }

  if (status === "missing") {
    return (
      <SurfaceCard>
        <div className="flex items-start gap-4">
          <Home className="mt-1 h-6 w-6 shrink-0 text-muted-foreground" />
          <div className="space-y-4">
            <PageHeader
              title="Finish onboarding first"
              subtitle="This page needs your household repository. Complete setup on the home screen, then come back."
            />
            <ActionGroup>
              <Button asChild>
                <Link href="/">Open onboarding</Link>
              </Button>
            </ActionGroup>
          </div>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard>
      <div className="flex items-start gap-4">
        <AlertCircle className="mt-1 h-6 w-6 shrink-0 text-destructive" />
        <div className="space-y-4">
          <PageHeader
            title="Could not reach GitHub"
            subtitle={error ?? "The household repository could not be resolved right now."}
          />
          <ActionGroup>
            <Button onClick={onRetry}>Try Again</Button>
            <Button asChild variant="outline">
              <Link href="/">Go Home</Link>
            </Button>
          </ActionGroup>
        </div>
      </div>
    </SurfaceCard>
  );
}

