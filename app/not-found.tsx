import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center text-zinc-950">
      <div className="space-y-4">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">OctoHome</p>
        <h1 className="text-6xl font-black uppercase tracking-tight">Page not found</h1>
        <p className="text-lg font-medium text-zinc-600">
          That page does not exist or has moved. Head back to your household dashboard.
        </p>
      </div>
      <Button asChild className="border-4 border-black px-8 py-6 text-lg font-black uppercase">
        <Link href="/">Go Home</Link>
      </Button>
    </main>
  );
}
