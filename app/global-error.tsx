"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-950">
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="max-w-xl space-y-4">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">OctoHome</p>
            <h1 className="text-5xl font-black uppercase tracking-tight">Something went wrong</h1>
            <p className="text-lg font-medium text-zinc-600">
              We hit an unexpected problem. Try again, or refresh the page if it keeps happening.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => reset()} className="border-4 border-black px-8 py-6 text-lg font-black uppercase">
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.assign("/")}
              className="border-4 border-black px-8 py-6 text-lg font-black uppercase"
            >
              Go Home
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
