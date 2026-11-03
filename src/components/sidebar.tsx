"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  UserRound,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

const navLinks: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Home", href: "/app", icon: Home },
  { label: "Profile", href: "/app/profile", icon: UserRound },
  { label: "Messages", href: "/app/messages", icon: MessageSquare },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="pixel-panel sticky top-0 flex h-screen w-1/6 shrink-0 flex-col p-4">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="grid size-10 place-items-center border-2 border-[#262044] bg-violet-300 font-mono font-black text-[#262044] shadow-[3px_3px_0_#f472b6]">
          LOGO
        </div>
        <span className="font-mono font-black tracking-wider text-[#262044]">
          YOU
        </span>
      </div>

      <p className="mb-3 px-3 font-mono text-xs font-bold uppercase tracking-widest text-violet-700">
        Main menu
      </p>

      <nav aria-label="Main navigation" className="space-y-2">
        {navLinks.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/app" && pathname.startsWith(`${href}/`));

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`pixel-nav-link flex items-center gap-3 px-3 py-3 font-mono text-sm font-bold ${
                active
                  ? "pixel-nav-link-active"
                  : "text-[#51496f] hover:text-[#262044]"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="group mt-auto flex items-center gap-2 border-t-2 border-violet-100 pt-4 font-mono text-xs font-bold uppercase text-violet-700">
        <span className="size-3 border-2 border-[#262044] bg-lime-300 group-hover:bg-red-400" />
        <Link href="/auth/logout">Logout</Link>
      </div>
    </aside>
  );
}