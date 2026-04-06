/**
 * Minimal issue shape shared between the tasks and board pages.
 * Fields are the subset actually consumed by the client UI.
 */
export type IssueAssignee = {
  login: string;
  avatar_url?: string | null;
};

export type IssueTask = {
  number: number;
  title: string;
  state: string;
  labels: Array<{ name: string }>;
  user: { login: string } | null;
  assignees: IssueAssignee[];
};

export type FamilyMember = {
  login: string;
  avatar_url: string;
  points: number;
  streak: number;
};

export type FamilyInviteResult = {
  username: string;
  success: boolean;
  status: "invited" | "already_has_access" | "failed";
  message: string;
};

export type { HomeViewer } from "./github-policy";
