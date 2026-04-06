"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Sidebar from "@/components/sidebar";
import { Database, LogOut, Settings, Shield } from "lucide-react";
import { ActionGroup } from "@/components/action-group";
import { AppearanceSettingsCard } from "@/components/appearance-settings-card";
import { PageHeader } from "@/components/page-header";
import { SurfaceCard } from "@/components/surface-card";
import { GithubIcon } from "@/components/ui/github-icon";
import { useResolvedHomeRepo } from "@/lib/use-resolved-home-repo";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store/use-onboarding-store";

const actionClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-[color:var(--interactive-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-color)] sm:w-auto";

const infoPanelClassName =
  "rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] p-4 sm:p-5";

export default function SettingsPage() {
  const { data: session } = useSession();
  const homeRepo = useResolvedHomeRepo();
  const { repoOwner, repoName } = homeRepo;
  const { isOrg, setGithubData } = useOnboardingStore();
  const repoUrl = repoOwner && repoName ? `https://github.com/${repoOwner}/${repoName}` : null;
  const accountUrl = session?.user?.login
    ? `https://github.com/${session.user.login}`
    : null;

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <PageHeader
            title="House Settings"
            subtitle="Choose how OctoHome looks and review the GitHub connection powering your household workspace."
            actions={
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-2 text-sm font-medium text-muted-foreground">
                <Settings className="h-4 w-4" />
                Household controls
              </span>
            }
          />

          <AppearanceSettingsCard />

          <SurfaceCard aria-labelledby="repo-settings-heading" className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Database className="h-4 w-4" />
                  Repo connection
                </div>
                <h2 id="repo-settings-heading" className="mt-2 text-xl font-semibold text-foreground">
                  Data Connection
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  OctoHome reads household tasks and state from your connected GitHub repository.
                </p>
              </div>

              {repoUrl ? (
                <a href={repoUrl} target="_blank" rel="noreferrer" className={actionClassName}>
                  Open Repo
                </a>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className={infoPanelClassName}>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  GitHub Repository
                </p>
                <p className="mt-3 break-all text-lg font-semibold text-foreground">
                  {repoOwner && repoName ? `${repoOwner}/${repoName}` : "Not connected yet"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  To connect a different household repo, sign out and run onboarding again.
                </p>
              </div>

              <div className={infoPanelClassName}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Storage Type
                    </p>
                    <p className="mt-3 text-lg font-semibold text-foreground">
                      {isOrg ? "Organization" : "Personal Account"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Your onboarding choice determines whether OctoHome writes to an organization or personal repo.
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[color:var(--interactive-bg)] text-muted-foreground">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard aria-labelledby="account-settings-heading" className="space-y-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <GithubIcon className="h-4 w-4" />
                Connected account
              </div>
              <h2 id="account-settings-heading" className="mt-2 text-xl font-semibold text-foreground">
                GitHub identity
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This account powers sign-in and links you back to GitHub when you need to manage the household repo.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  className="h-20 w-20 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] object-cover"
                  alt={session.user.name ?? "Profile photo"}
                />
              ) : (
                <div className="h-20 w-20 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)]" />
              )}

              <div className="min-w-0">
                <p className="text-lg font-semibold text-foreground">{session?.user?.name}</p>
                <p className="mt-1 break-all text-sm text-muted-foreground">{session?.user?.email}</p>
              </div>
            </div>

            <ActionGroup>
              {accountUrl ? (
                <a href={accountUrl} target="_blank" rel="noreferrer" className={actionClassName}>
                  <GithubIcon className="h-4 w-4" />
                  Open GitHub
                </a>
              ) : (
                <Link href="/" className={actionClassName}>
                  Open Dashboard
                </Link>
              )}
              <button
                type="button"
                className={cn(actionClassName, "text-destructive")}
                onClick={() => {
                  setGithubData({
                    githubUsername: "",
                    repoOwner: "",
                    repoName: "",
                    householdName: "",
                  });
                  void signOut({ callbackUrl: "/" });
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </ActionGroup>
          </SurfaceCard>

          <p className="text-center text-sm text-muted-foreground">OctoHome • Powered by GitHub Issues</p>
        </div>
      </main>
    </div>
  );
}
