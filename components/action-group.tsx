import React from "react";

export function ActionGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 sm:gap-3">{children}</div>;
}
