/**
 * Minimal issue shape shared between the tasks and board pages.
 * Fields are the subset actually consumed by the client UI.
 */
export type IssueTask = {
  number: number;
  title: string;
  state: string;
  labels: Array<{ name: string }>;
  user: { login: string } | null;
};

export type FamilyMember = {
  login: string;
  avatar_url: string;
  points: number;
  streak: number;
};
