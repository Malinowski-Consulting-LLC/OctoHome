import React from "react";

import { SurfaceCard } from "@/components/surface-card";

export function MetricCard(props: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <SurfaceCard className="flex items-start gap-4 sm:gap-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] bg-[color:var(--interactive-bg)]">
        {props.icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {props.label}
        </p>
        <div className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
          {props.value}
        </div>
      </div>
    </SurfaceCard>
  );
}
