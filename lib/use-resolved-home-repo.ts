"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import type { HomeRepoSummary } from "@/lib/github";
import type { HomeViewer } from "@/lib/types";
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
  viewer?: HomeViewer | null;
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
  const [viewer, setViewer] = useState<HomeViewer | null>(null);

  const sessionLogin = session?.user?.login ?? "";
  const hasRepo = Boolean(repoOwner && repoName);
  const loginChanged = Boolean(githubUsername && sessionLogin && githubUsername !== sessionLogin);
  const requestedOwner = loginChanged ? "" : repoOwner;
  const shouldDiscover =
    sessionStatus !== "loading" &&
    Boolean(sessionLogin) &&
    (loginChanged || !hasRepo || !viewer || refreshKey > 0);

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
        const res = await fetch("/api/home", {
          cache: "no-store",
          headers: requestedOwner ? { "x-octohome-repo-owner": requestedOwner } : undefined,
        });
        const payload = (await res.json().catch(() => ({}))) as HomeDiscoveryResponse;

        if (cancelled) {
          return;
        }

        if (!res.ok) {
          setViewer(null);
          setDiscovery({
            kind: "error",
            error: payload.error ?? "Could not reach GitHub.",
          });
          setRefreshKey(0);
          return;
        }

        if (payload.repo) {
          setViewer(payload.repo.viewer ?? payload.viewer ?? null);
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

        setViewer(null);
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

        setViewer(null);
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
  }, [refreshKey, requestedOwner, sessionLogin, setGithubData, shouldDiscover]);

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
    viewer: status === "ready" ? viewer : null,
    hasRepo: status === "ready" && hasRepo,
  };
}
