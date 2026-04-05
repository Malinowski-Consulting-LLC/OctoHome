import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Data-only fields persisted to storage. Excludes store action methods. */
export type OnboardingData = {
  step: number;
  githubUsername: string;
  householdName: string;
  repoOwner: string;
  repoName: string;
  isOrg: boolean;
  /** GitHub organization login (required when isOrg is true). */
  orgLogin: string;
  invitedMembers: string[];
  magicEnabled: boolean;
};

interface OnboardingState extends OnboardingData {
  setStep: (step: number) => void;
  setGithubData: (data: Partial<OnboardingData>) => void;
  addInvitedMember: (username: string) => void;
  toggleMagic: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: 0,
      githubUsername: "",
      householdName: "",
      repoOwner: "",
      repoName: "",
      isOrg: false,
      orgLogin: "",
      invitedMembers: [],
      magicEnabled: true,
      setStep: (step) => set({ step }),
      setGithubData: (data) => set((state) => ({ ...state, ...data })),
      addInvitedMember: (username) =>
        set((state) => {
          if (state.invitedMembers.includes(username)) return state;
          return { invitedMembers: [...state.invitedMembers, username] };
        }),
      toggleMagic: () => set((state) => ({ magicEnabled: !state.magicEnabled })),
    }),
    {
      name: "octohome-onboarding",
    }
  )
);
