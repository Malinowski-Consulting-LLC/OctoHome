import React from "react";

import { cn } from "@/lib/utils";

type SurfaceCardProps = React.ComponentPropsWithoutRef<"section"> & {
  tone?: "default" | "subtle" | "accent";
};

export function SurfaceCard({ children, tone, className, ...rest }: SurfaceCardProps) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] p-4 shadow-[var(--shadow-card)] sm:p-6",
        tone === "subtle" && "bg-[color:var(--surface-2)]",
        tone === "accent" && "bg-[image:var(--accent-gradient)]",
        className
      )}
      {...rest}
    >
      {children}
    </section>
  );
}
