import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  step: number;
  githubUsername: string;
  householdName: string;
  repoOwner: string; // User or Org
  repoName: string;
  isOrg: boolean;
  invitedMembers: string[];
  setStep: (step: number) => void;
  setGithubData: (data: Partial<OnboardingState>) => void;
  addInvitedMember: (username: string) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: 0,
      githubUsername: "",
      householdName: "",
      repoOwner: "",
      repoName: "home-ops",
      isOrg: false,
      invitedMembers: [],
      setStep: (step) => set({ step }),
      setGithubData: (data) => set((state) => ({ ...state, ...data })),
      addInvitedMember: (username) =>
        set((state) => ({
          invitedMembers: [...state.invitedMembers, username],
        })),
    }),
    {
      name: "octohome-onboarding",
    }
  )
);
