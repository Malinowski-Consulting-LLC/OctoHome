import React from "react";

import { ActionGroup } from "@/components/action-group";

export function PageHeader(props: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {props.title}
        </h1>
        {props.subtitle ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {props.subtitle}
          </p>
        ) : null}
      </div>
      {props.actions ? <ActionGroup>{props.actions}</ActionGroup> : null}
    </header>
  );
}
