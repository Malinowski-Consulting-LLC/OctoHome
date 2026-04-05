"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import type { HomeRepoSummary } from "@/lib/github";
import { useOnboardingStore } from "@/store/use-onboarding-store";

export type ResolvedHomeRepoStatus =
  | "auth-loading"
  | "signed-out"
  | "loading"
  | "ready"
  | "missing"
  | "error";

type HomeDiscoveryResponse = {
  repo?: HomeRepoSummary | null;
  error?: string;
};

type DiscoveryState =
  | { kind: "idle" }
  | { kind: "missing" }
  | { kind: "error"; error: string };

export function useResolvedHomeRepo() {
  const { data: session, status: sessionStatus } = useSession();
  const { githubUsername, householdName, repoOwner, repoName, setGithubData } = useOnboardingStore();
  const [discovery, setDiscovery] = useState<DiscoveryState>({ kind: "idle" });
  const [refreshKey, setRefreshKey] = useState(0);

  const sessionLogin = session?.user?.login ?? "";
  const hasRepo = Boolean(repoOwner && repoName);
  const loginChanged = Boolean(githubUsername && sessionLogin && githubUsername !== sessionLogin);
  const shouldDiscover =
    sessionStatus !== "loading" && Boolean(sessionLogin) && (loginChanged || !hasRepo || refreshKey > 0);

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!shouldDiscover) {
      return;
    }

    let cancelled = false;

    async function discoverRepo() {
      try {
        const res = await fetch("/api/home", { cache: "no-store" });
        const payload = (await res.json().catch(() => ({}))) as HomeDiscoveryResponse;

        if (cancelled) {
          return;
        }

        if (!res.ok) {
          setDiscovery({
            kind: "error",
            error: payload.error ?? "Could not reach GitHub.",
          });
          setRefreshKey(0);
          return;
        }

        if (payload.repo) {
          setGithubData({
            githubUsername: sessionLogin,
            repoOwner: payload.repo.owner,
            repoName: payload.repo.name,
            householdName: payload.repo.bootstrap?.household ?? "",
          });
          setDiscovery({ kind: "idle" });
          setRefreshKey(0);
          return;
        }

        setGithubData({
          githubUsername: sessionLogin,
          repoOwner: "",
          repoName: "",
          householdName: "",
        });
        setDiscovery({ kind: "missing" });
        setRefreshKey(0);
      } catch {
        if (cancelled) {
          return;
        }

        setDiscovery({
          kind: "error",
          error: "Could not reach GitHub.",
        });
        setRefreshKey(0);
      }
    }

    void discoverRepo();

    return () => {
      cancelled = true;
    };
  }, [refreshKey, sessionLogin, setGithubData, shouldDiscover]);

  let status: ResolvedHomeRepoStatus;
  if (sessionStatus === "loading") {
    status = "auth-loading";
  } else if (!sessionLogin) {
    status = "signed-out";
  } else if (!shouldDiscover) {
    status = "ready";
  } else if (discovery.kind === "missing") {
    status = "missing";
  } else if (discovery.kind === "error") {
    status = "error";
  } else {
    status = "loading";
  }

  return {
    session,
    status,
    error: discovery.kind === "error" ? discovery.error : null,
    refresh,
    repoOwner,
    repoName,
    householdName,
    hasRepo: status === "ready" && hasRepo,
  };
}
