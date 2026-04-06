import type { NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";

import { serverEnv } from "@/lib/env";

export const authOptions: NextAuthOptions = {
  secret: serverEnv.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    GitHub({
      clientId: serverEnv.GITHUB_ID,
      clientSecret: serverEnv.GITHUB_SECRET,
      authorization: {
        params: {
          scope: "repo read:user user:email workflow",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (typeof account?.access_token === "string") {
        token.accessToken = account.access_token;
      }
      if (
        profile &&
        typeof profile === "object" &&
        "login" in profile &&
        typeof profile.login === "string"
      ) {
        token.login = profile.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.login === "string") {
        session.user = { ...session.user, login: token.login };
      }
      return session;
    },
  },
};
