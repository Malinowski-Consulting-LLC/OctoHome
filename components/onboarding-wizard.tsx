"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import {
  ArrowRight,
  ExternalLink,
  Github,
  Home,
  Loader2,
  Plus,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import { ActionGroup } from "@/components/action-group";
import { SurfaceCard } from "@/components/surface-card";
import { Input } from "@/components/ui/input";
import { useOnboardingStore } from "@/store/use-onboarding-store";

type SetupResponse =
  | {
      success: true;
      repoOwner: string;
      repoName: string;
      repoCreated: boolean;
      inviteResults: Array<{ username: string; success: boolean }>;
    }
  | {
      success?: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
      retryable?: boolean;
    };

const PRODUCT_RELEASES_URL = "https://github.com/Malinowski-Consulting-LLC/OctoHome/releases";

const stepMeta = [
  {
    eyebrow: "Step 1",
    title: "Name your household",
    description:
      "Pick the friendly name OctoHome will show around the app. Your GitHub repo still stays on the home-ops setup path.",
  },
  {
    eyebrow: "Step 2",
    title: "Choose where the repo lives",
    description:
      "Decide whether OctoHome should create the household repo under your personal account or a GitHub organization.",
  },
  {
    eyebrow: "Step 3",
    title: "Invite your family",
    description:
      "Add GitHub usernames now so OctoHome can invite everyone as the repository comes online.",
  },
  {
    eyebrow: "Step 4",
    title: "Launch your workspace",
    description:
      "OctoHome will create the repo, set up labels, and invite the people you selected.",
  },
  {
    eyebrow: "Done",
    title: "Welcome home",
    description:
      "Your household workspace is live. Open the repo, grab the desktop build, or head straight into the dashboard.",
  },
] as const;

const baseButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-color)] disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClassName = `${baseButtonClassName} border border-transparent bg-[color:var(--accent-solid)] text-[color:var(--app-bg)] hover:opacity-90`;
const secondaryButtonClassName = `${baseButtonClassName} border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] text-foreground hover:bg-[color:var(--interactive-hover)]`;
const inputClassName =
  "h-14 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-4 text-base font-medium normal-case not-italic shadow-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[color:var(--ring-color)]";
const infoPanelClassName =
  "rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] p-4";

function SignedOutFeature(props: { title: string; description: string; icon: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[color:var(--surface-1)] text-foreground">
        {props.icon}
      </div>
      <h2 className="mt-4 text-base font-semibold text-foreground">{props.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{props.description}</p>
    </div>
  );
}

export default function OnboardingWizard() {
  const { data: session } = useSession();
  const sessionLogin = session?.user?.login ?? "";
  const {
    step,
    setStep,
    setGithubData,
    householdName,
    repoOwner,
    repoName,
    isOrg,
    orgLogin,
    invitedMembers,
    addInvitedMember,
  } = useOnboardingStore();
  const [newMember, setNewMember] = useState("");
  const [isBlastingOff, setIsBlastingOff] = useState(false);
  const [blastError, setBlastError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [inviteFailures, setInviteFailures] = useState<string[]>([]);

  const nextStep = () => setStep(step + 1);
  const currentStep = Math.min(step, stepMeta.length - 1);

  const handleBlastOff = async () => {
    setBlastError(null);
    setProgressMessage(null);
    setInviteFailures([]);

    if (isOrg && !orgLogin.trim()) {
      setBlastError("Please enter your GitHub organization login before launching.");
      return;
    }

    setIsBlastingOff(true);
    setProgressMessage("Contacting GitHub…");

    try {
      const payload = {
        householdName,
        isOrg,
        orgLogin: isOrg ? orgLogin.trim() : undefined,
        invitedMembers,
      };

      for (let attempt = 0; attempt < 3; attempt++) {
        setProgressMessage(
          attempt === 0
            ? "Creating your home-ops repository…"
            : "GitHub is still provisioning your repository…"
        );

        const res = await fetch("/api/onboarding/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data: SetupResponse = await res.json();

        if (!res.ok || !data.success) {
          if (res.status === 503 && "retryable" in data && data.retryable && attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }

          const message = "error" in data ? data.error : "Setup failed. Please try again.";
          setBlastError(message);
          return;
        }

        const failedInvites = data.inviteResults
          .filter((result) => !result.success)
          .map((result) => result.username);

        setProgressMessage("Finalising…");
        setInviteFailures(failedInvites);
        setGithubData({
          githubUsername: sessionLogin,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
        });
        nextStep();
        return;
      }

      setBlastError("GitHub is still provisioning your repository. Please wait a moment and try again.");
    } catch {
      setBlastError("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsBlastingOff(false);
      setProgressMessage(null);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <SurfaceCard tone="accent" data-card-role="hero" className="relative overflow-hidden">
              <div
                className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[image:var(--hero-glow)] opacity-50 blur-3xl"
                data-magic-effect
              />
              <div className="relative z-10 space-y-6">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    <Home className="h-3.5 w-3.5" />
                    Household setup
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                      Bring your family workspace online.
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                      OctoHome turns GitHub into a calm household operating system: shared tasks, family streaks, AI
                      capture, and a setup flow built for mobile or desktop.
                    </p>
                  </div>

                  <ActionGroup>
                    <button type="button" onClick={() => signIn("github")} className={primaryButtonClassName}>
                      <Github className="h-4 w-4" />
                      Connect GitHub
                    </button>
                    <a
                      href="https://github.com/signup"
                      target="_blank"
                      rel="noreferrer"
                      className={secondaryButtonClassName}
                    >
                      Create GitHub account
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </ActionGroup>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <SignedOutFeature
                    title="Shared family repo"
                    description="Keep chores, routines, and points in one GitHub-backed household workspace."
                    icon={<Users className="h-5 w-5" />}
                  />
                  <SignedOutFeature
                    title="AI task capture"
                    description="Describe a chore in plain language and turn it into a structured GitHub issue."
                    icon={<Sparkles className="h-5 w-5" />}
                  />
                  <SignedOutFeature
                    title="Responsive everywhere"
                    description="Use the same household control surface on desktop, tablet, mobile, or PWA install."
                    icon={<Home className="h-5 w-5" />}
                  />
                </div>
              </div>
            </SurfaceCard>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Household setup</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Build your OctoHome workspace
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Connect GitHub, choose your storage model, and invite everyone who should share the household repo.
            </p>
          </div>
          <span className="inline-flex items-center justify-center rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-2 text-sm font-medium text-muted-foreground">
            Step {currentStep + 1} of {stepMeta.length}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {stepMeta.map((meta, index) => {
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div key={meta.title} className="space-y-2">
                <div
                  className={`h-2 rounded-full ${
                    isComplete || isActive ? "bg-[color:var(--accent-solid)]" : "bg-[color:var(--surface-2)]"
                  }`}
                />
                <p className={`text-[11px] font-medium uppercase tracking-[0.16em] ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {meta.eyebrow}
                </p>
              </div>
            );
          })}
        </div>

        <SurfaceCard tone={currentStep === stepMeta.length - 1 ? "accent" : "default"} data-card-role="hero" className="relative overflow-hidden">
          {currentStep === stepMeta.length - 1 ? (
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[image:var(--hero-glow)] opacity-50 blur-3xl"
              data-magic-effect
            />
          ) : null}

          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 space-y-6"
          >
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {stepMeta[currentStep].eyebrow}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {stepMeta[currentStep].title}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">{stepMeta[currentStep].description}</p>
            </div>

            {step === 0 ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="household-name" className="text-sm font-semibold text-foreground">
                    Household name
                  </label>
                  <Input
                    id="household-name"
                    type="text"
                    placeholder="e.g. The Smith Family"
                    className={inputClassName}
                    value={householdName}
                    onChange={(event) => setGithubData({ householdName: event.target.value })}
                  />
                  <p className="text-sm leading-6 text-muted-foreground">
                    This is the friendly name OctoHome shows in the app. The GitHub repo stays on the home-ops setup
                    path behind the scenes.
                  </p>
                </div>

                <ActionGroup>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!householdName.trim()}
                    className={primaryButtonClassName}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </ActionGroup>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setGithubData({ isOrg: false, orgLogin: "" });
                    nextStep();
                  }}
                  className="rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] p-5 text-left transition-colors hover:bg-[color:var(--interactive-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-color)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[color:var(--surface-1)] text-foreground">
                    <Github className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">Personal account</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Simple setup in your own GitHub namespace. Great when one person is administering the family repo.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGithubData({ isOrg: true });
                    nextStep();
                  }}
                  className="rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] p-5 text-left transition-colors hover:bg-[color:var(--interactive-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-color)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[color:var(--surface-1)] text-foreground">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">Organization</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Keep household administration in a shared GitHub organization with clearer ownership boundaries.
                  </p>
                </button>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                {isOrg ? (
                  <div className="space-y-2">
                    <label htmlFor="org-login" className="text-sm font-semibold text-foreground">
                      Organization login
                    </label>
                    <Input
                      id="org-login"
                      type="text"
                      placeholder="e.g. smith-family-org"
                      className={inputClassName}
                      value={orgLogin}
                      onChange={(event) => setGithubData({ orgLogin: event.target.value })}
                    />
                    <p className="text-sm leading-6 text-muted-foreground">
                      Enter the exact GitHub organization login, not the display name.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label htmlFor="invite-member" className="text-sm font-semibold text-foreground">
                    Invite GitHub usernames
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="invite-member"
                      type="text"
                      placeholder="GitHub username"
                      className={inputClassName}
                      value={newMember}
                      onChange={(event) => setNewMember(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newMember.trim()) {
                          addInvitedMember(newMember.trim());
                          setNewMember("");
                        }
                      }}
                      className={secondaryButtonClassName}
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Family members</p>
                  <div className="flex flex-wrap gap-2">
                    {invitedMembers.length > 0 ? (
                      invitedMembers.map((member) => (
                        <span
                          key={member}
                          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] px-3 py-1.5 text-sm font-medium text-foreground"
                        >
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {member}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm leading-6 text-muted-foreground">
                        No family members added yet. You can keep going and invite them later from GitHub if you want.
                      </p>
                    )}
                  </div>
                </div>

                <ActionGroup>
                  <button type="button" onClick={nextStep} className={primaryButtonClassName}>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </ActionGroup>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className={infoPanelClassName}>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Household
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">{householdName || "Unnamed household"}</p>
                  </div>
                  <div className={infoPanelClassName}>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Storage
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {isOrg ? `Organization: ${orgLogin || "pending login"}` : "Personal account"}
                    </p>
                  </div>
                  <div className={infoPanelClassName}>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Invites
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {invitedMembers.length === 0 ? "No invites queued" : `${invitedMembers.length} ready to send`}
                    </p>
                  </div>
                </div>

                <div className={infoPanelClassName}>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">What OctoHome will do next</p>
                    <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                      <li>Create the household repo</li>
                      <li>Configure the labels OctoHome expects</li>
                      <li>Invite the GitHub usernames you added here</li>
                    </ul>
                  </div>
                </div>

                {progressMessage ? (
                  <div className={infoPanelClassName}>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {progressMessage}
                    </div>
                  </div>
                ) : null}

                {blastError ? (
                  <div
                    role="alert"
                    className="rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-4 py-3 text-sm font-medium text-foreground"
                  >
                    {blastError}
                  </div>
                ) : null}

                <ActionGroup>
                  <button
                    type="button"
                    onClick={handleBlastOff}
                    disabled={isBlastingOff}
                    className={primaryButtonClassName}
                  >
                    {isBlastingOff ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {progressMessage ?? "Working…"}
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4" />
                        Start setup
                      </>
                    )}
                  </button>
                </ActionGroup>
              </div>
            ) : null}

            {step >= 4 ? (
              <div className="space-y-6">
                <div className="rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[color:var(--surface-1)] text-foreground">
                      <Rocket className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">Your household repo is ready</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {repoOwner && repoName ? `${repoOwner}/${repoName}` : "home-ops"} is now wired into OctoHome.
                      </p>
                    </div>
                  </div>
                </div>

                {inviteFailures.length > 0 ? (
                  <div className="rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-4 py-3 text-sm text-foreground">
                    Repo setup finished, but these invites still need attention: {inviteFailures.join(", ")}
                  </div>
                ) : null}

                <ActionGroup>
                  <a href={PRODUCT_RELEASES_URL} target="_blank" rel="noreferrer" className={secondaryButtonClassName}>
                    Desktop downloads
                  </a>
                  <a
                    href={repoOwner && repoName ? `https://github.com/${repoOwner}/${repoName}` : "/"}
                    target="_blank"
                    rel="noreferrer"
                    className={secondaryButtonClassName}
                  >
                    Open repo
                  </a>
                  <button
                    type="button"
                    onClick={() => window.location.assign("/")}
                    className={primaryButtonClassName}
                  >
                    Enter dashboard
                  </button>
                </ActionGroup>
              </div>
            ) : null}
          </motion.div>
        </SurfaceCard>
      </div>
    </div>
  );
}
