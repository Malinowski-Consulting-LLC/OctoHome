import type { ReactNode, RefObject } from "react";

import { cn } from "@/lib/utils";

import Sidebar from "./sidebar";

type AppShellProps = {
  children: ReactNode;
  outerRef?: RefObject<HTMLDivElement | null>;
  familyRef?: RefObject<HTMLAnchorElement | null>;
  width?: "default" | "full";
  contentClassName?: string;
};

export function AppShell({
  children,
  outerRef,
  familyRef,
  width = "default",
  contentClassName,
}: AppShellProps) {
  return (
    <div
      ref={outerRef}
      className="relative flex min-h-screen overflow-hidden bg-background text-foreground [transform:translateZ(0)]"
    >
      <Sidebar familyRef={familyRef} />

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div
          className={cn(
            "mx-auto flex flex-col gap-6",
            width === "full" ? "w-full" : "w-full max-w-5xl",
            contentClassName
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
