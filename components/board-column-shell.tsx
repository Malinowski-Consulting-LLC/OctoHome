import React from "react";

import { SurfaceCard } from "@/components/surface-card";

export function BoardColumnShell(props: {
  title: string;
  count: number;
  children: React.ReactNode;
  titleRef?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <SurfaceCard data-board-column className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 ref={props.titleRef} className="text-base font-semibold">{props.title}</h2>
        <span className="rounded-full bg-[color:var(--interactive-bg)] px-2 py-1 text-xs tabular-nums text-muted-foreground">{props.count}</span>
      </div>
      {props.children}
    </SurfaceCard>
  );
}
