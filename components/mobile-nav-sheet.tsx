"use client";

import { useState } from "react";

import * as Dialog from "@radix-ui/react-dialog";
import { Home, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { cn } from "@/lib/utils";

import { isNavItemActive, sidebarNavItems } from "./sidebar-nav";

export default function MobileNavSheet() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const profileName = session?.user?.name || "Household";
  const profileEmail = session?.user?.email || "Connected account";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open navigation menu"
          className="fixed left-4 top-4 z-40 inline-flex size-12 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] text-foreground shadow-[var(--shadow-card)] backdrop-blur-xl transition-colors hover:bg-[color:var(--interactive-hover)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ring-color)] md:hidden"
        >
          <Menu className="size-5" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm md:hidden" />

        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[22rem] max-w-[calc(100vw-1rem)] flex-col overflow-y-auto border-r border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-4 py-4 text-foreground shadow-[var(--shadow-card)] backdrop-blur-xl outline-none md:hidden">
          <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
          <Dialog.Description className="sr-only">
            Navigate around OctoHome and manage your account.
          </Dialog.Description>

          <div className="mb-6 flex items-center justify-between gap-3">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-[var(--radius-control)] px-2 py-1.5 focus:outline-none focus:ring-4 focus:ring-[color:var(--ring-color)]"
            >
              <span className="flex size-11 items-center justify-center rounded-[14px] bg-[color:var(--accent-solid)] text-[color:var(--app-bg)] shadow-[var(--shadow-card)]">
                <Home className="size-5" />
              </span>

              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Home OS
                </span>
                <span className="block text-lg font-semibold text-foreground">OctoHome</span>
              </span>
            </Link>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close navigation menu"
                className="inline-flex size-11 items-center justify-center rounded-[14px] border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] text-muted-foreground transition-colors hover:bg-[color:var(--interactive-hover)] hover:text-foreground focus:outline-none focus:ring-4 focus:ring-[color:var(--ring-color)]"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <nav className="flex flex-1 flex-col gap-2" aria-label="Mobile navigation">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-control)] border px-3 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[color:var(--ring-color)]",
                    isActive
                      ? "border-[color:var(--border-strong)] bg-[color:var(--interactive-bg)] text-foreground shadow-[var(--shadow-card)]"
                      : "border-transparent text-muted-foreground hover:border-[color:var(--border-subtle)] hover:bg-[color:var(--interactive-hover)] hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-[14px] transition-colors",
                      isActive
                        ? "bg-[color:var(--accent-solid)] text-[color:var(--app-bg)]"
                        : "bg-[color:var(--interactive-bg)] text-muted-foreground"
                    )}
                  >
                    <Icon className="size-5" />
                  </span>

                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={`${profileName} avatar`}
                  className="size-12 shrink-0 rounded-[14px] border border-[color:var(--border-subtle)] object-cover"
                />
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] text-sm font-semibold text-muted-foreground">
                  {profileName.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{profileName}</p>
                <p className="truncate text-xs text-muted-foreground">{profileEmail}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void signOut({ callbackUrl: "/" });
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-[color:var(--interactive-hover)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ring-color)]"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
