import { z } from "zod";

const serverEnvSchema = z.object({
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  GITHUB_ID: z.string().min(1, "GITHUB_ID is required"),
  GITHUB_SECRET: z.string().min(1, "GITHUB_SECRET is required"),
  APP_URL: z.string().url().optional(),
});

const parsedServerEnv = serverEnvSchema.safeParse({
  AUTH_SECRET: process.env.AUTH_SECRET,
  GITHUB_ID: process.env.GITHUB_ID ?? process.env.GH_ID,
  GITHUB_SECRET: process.env.GITHUB_SECRET ?? process.env.GH_SECRET,
  APP_URL: process.env.APP_URL,
});

if (!parsedServerEnv.success) {
  const missing = parsedServerEnv.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`Missing or invalid server environment variables: ${missing}`);
}

export const serverEnv = parsedServerEnv.data;
