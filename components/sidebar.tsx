"use client";

import type { RefObject } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { cn } from "@/lib/utils";

import MobileNavSheet from "./mobile-nav-sheet";
import { isNavItemActive, sidebarNavItems } from "./sidebar-nav";

type SidebarProps = {
  familyRef?: RefObject<HTMLAnchorElement | null>;
};

export default function Sidebar({ familyRef }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const profileName = session?.user?.name || "Household";
  const profileEmail = session?.user?.email || "Connected account";

  return (
    <>
      <MobileNavSheet />

      <aside className="sticky top-0 hidden h-screen shrink-0 md:flex md:w-[88px] xl:w-[var(--shell-rail-width)]">
        <div className="flex h-full w-full flex-col overflow-y-auto border-r border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-2 py-4 text-foreground backdrop-blur-xl xl:px-3">
          <Link
            href="/"
            aria-label="Go to dashboard"
            className="mb-6 flex items-center gap-3 rounded-[var(--radius-control)] border border-transparent px-2 py-2 transition-colors hover:bg-[color:var(--interactive-hover)] focus:outline-none focus:ring-4 focus:ring-[color:var(--ring-color)] md:justify-center xl:justify-start"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[color:var(--accent-solid)] text-[color:var(--app-bg)] shadow-[var(--shadow-card)]">
              <Home className="size-5" />
            </span>

            <span className="hidden min-w-0 flex-col xl:flex">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Home OS
              </span>
              <span className="text-lg font-semibold text-foreground">OctoHome</span>
            </span>
          </Link>

          <nav className="flex flex-1 flex-col gap-2" aria-label="Primary navigation">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={item.href === "/family" ? familyRef : undefined}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  title={item.label}
                  className={cn(
                    "group flex items-center gap-3 rounded-[var(--radius-control)] border px-3 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[color:var(--ring-color)] md:justify-center md:px-0 xl:justify-start xl:px-4",
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
                        : "bg-[color:var(--interactive-bg)] text-muted-foreground group-hover:bg-[color:var(--interactive-hover)] group-hover:text-foreground"
                    )}
                  >
                    <Icon className="size-5" />
                  </span>

                  <span className="hidden xl:block">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[color:var(--interactive-bg)] p-2 shadow-[var(--shadow-card)] xl:p-4">
            <div className="flex items-center gap-3 md:flex-col xl:flex-row">
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

              <div className="hidden min-w-0 flex-1 xl:block">
                <p className="truncate text-sm font-semibold text-foreground">{profileName}</p>
                <p className="truncate text-xs text-muted-foreground">{profileEmail}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  void signOut({ callbackUrl: "/" });
                }}
                aria-label="Sign out"
                title="Sign out"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] text-muted-foreground transition-colors hover:bg-[color:var(--interactive-hover)] hover:text-foreground focus:outline-none focus:ring-4 focus:ring-[color:var(--ring-color)]"
              >
                <LogOut className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
