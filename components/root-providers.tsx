"use client";

import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { AppearanceProvider } from "@/components/appearance-provider";

export function RootProviders({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  return (
    <AppearanceProvider>
      <SessionProvider session={session}>{children}</SessionProvider>
    </AppearanceProvider>
  );
}
