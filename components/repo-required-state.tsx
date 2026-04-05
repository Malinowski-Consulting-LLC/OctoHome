"use client";

import Link from "next/link";
import { AlertCircle, Home, Loader2 } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";

import { Button } from "@/components/ui/button";
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
      <div className="border-8 border-black bg-white p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-6">
          <Loader2 className="h-10 w-10 animate-spin" />
          <div>
            <h2 className="text-3xl font-black uppercase">Loading your home</h2>
            <p className="mt-2 text-lg font-bold text-zinc-500">
              Checking your GitHub connection and household repository.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "signed-out") {
    return (
      <div className="border-8 border-black bg-white p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-start gap-6">
          <GithubIcon className="mt-1 h-10 w-10 flex-shrink-0" />
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-black uppercase">Sign in to continue</h2>
              <p className="mt-2 text-lg font-bold text-zinc-500">
                Open the home screen and connect your GitHub account before using this page.
              </p>
            </div>
            <Button asChild className="border-4 border-black font-black uppercase">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div className="border-8 border-black bg-white p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-start gap-6">
          <Home className="mt-1 h-10 w-10 flex-shrink-0" />
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-black uppercase">Finish onboarding first</h2>
              <p className="mt-2 text-lg font-bold text-zinc-500">
                This page needs your household repository. Complete setup on the home screen, then come back.
              </p>
            </div>
            <Button asChild className="border-4 border-black font-black uppercase">
              <Link href="/">Open onboarding</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-8 border-red-600 bg-white p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-start gap-6">
        <AlertCircle className="mt-1 h-10 w-10 flex-shrink-0 text-red-600" />
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-black uppercase text-red-600">Could not reach GitHub</h2>
            <p className="mt-2 text-lg font-bold text-zinc-500">
              {error ?? "The household repository could not be resolved right now."}
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={onRetry} className="border-4 border-black font-black uppercase">
              Try Again
            </Button>
            <Button asChild variant="outline" className="border-4 border-black font-black uppercase">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
