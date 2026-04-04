"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, KanbanSquare, Users, Sparkles, Settings, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/board", label: "Family Board", icon: KanbanSquare },
  { href: "/ai", label: "AI Copilot", icon: Sparkles },
  { href: "/family", label: "Family", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-80 bg-white border-r-8 border-black flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <Link href="/" className="flex items-center gap-4">
          <div className="w-14 h-14 bg-black rounded-none flex items-center justify-center">
            <Home className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tighter uppercase">OctoHome</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-4 mt-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-6 py-4 border-4 transition-all uppercase font-black text-xl ${
                isActive 
                  ? "bg-black text-white border-black" 
                  : "text-zinc-500 border-transparent hover:border-black hover:text-black"
              }`}
            >
              <Icon className="w-6 h-6" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="border-4 border-black p-4 flex items-center gap-4 bg-zinc-50">
          {session?.user?.image ? (
            <img src={session.user.image} alt="Avatar" className="w-12 h-12 rounded-none border-2 border-black" />
          ) : (
            <div className="w-12 h-12 border-2 border-black bg-zinc-200" />
          )}
          <div className="flex-1 truncate">
            <p className="text-lg font-black uppercase truncate leading-none">{session?.user?.name || "Family"}</p>
          </div>
          <button onClick={() => signOut()} className="text-zinc-400 hover:text-red-600 transition-colors">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>
    </aside>
  );
}
