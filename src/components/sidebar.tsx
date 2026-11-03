"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Home,
  Map,
  Settings,
  type LucideIcon,
} from "lucide-react";

const navLinks: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Home", href: "/app", icon: Home },
  { label: "Messages", href: "/app/map", icon: Map },
  { label: "Profile", href: "/app/voyages", icon: Compass },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="pixel-panel sticky top-0 flex h-screen w-64 shrink-0 flex-col p-4">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="grid size-10 place-items-center border-2 border-amber-700 bg-amber-100 text-amber-800 shadow-[3px_3px_0_#c6a85a]">
          <Compass size={21} />
        </div>
        <span className="font-mono font-bold tracking-wide text-amber-950">
          YOU
        </span>
      </div>

      <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-800">
        Captain's deck
      </p>

      <nav aria-label="Main navigation" className="space-y-1">
        {navLinks.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/app" && pathname.startsWith(`${href}/`));

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`pixel-link flex items-center gap-3 px-3 py-3 font-mono text-sm ${
                active ? "pixel-link-active" : ""
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-amber-900/20 pt-4 font-mono text-[10px] uppercase tracking-wider text-amber-800">
        ⚓ All hands aboard
      </div>
    </aside>
  );
}