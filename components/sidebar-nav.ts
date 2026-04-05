import {
  Home,
  KanbanSquare,
  ListTodo,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const sidebarNavItems: SidebarNavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/board", label: "Family Board", icon: KanbanSquare },
  { href: "/ai", label: "AI Copilot", icon: Sparkles },
  { href: "/family", label: "Family", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isNavItemActive(pathname: string | null | undefined, href: string) {
  if (!pathname) {
    return false;
  }

  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
