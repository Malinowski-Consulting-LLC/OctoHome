import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
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
      if (typeof token.accessToken === "string") {
        session.accessToken = token.accessToken;
      }
      if (typeof token.login === "string") {
        session.user = { ...session.user, login: token.login };
      }
      return session;
    },
  },
});
