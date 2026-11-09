"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Search, UserRound } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/app", icon: Home },
  { label: "Search", href: "/app/search", icon: Search },
  { label: "Messages", href: "/app/messages", icon: MessageSquare },
  { label: "Profile", href: "/app/profile", icon: UserRound },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="mobile-dock fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-divider bg-background md:sticky md:top-[var(--header-height)] md:bottom-auto md:flex md:w-18 md:shrink-0 md:flex-col md:gap-2 md:self-start md:border-t-0 md:p-3 lg:w-52 lg:px-4 lg:py-6"
    >
      <p className="eyebrow hidden px-3 pb-2 lg:block">Menu</p>
      {navLinks.map(({ label, href, icon: Icon }) => {
        const active =
          pathname === href ||
          (href === "/app/profile" && pathname.startsWith("/app/profile/"));

        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-semibold focus-visible:-outline-offset-2 md:rounded-xl lg:flex-row lg:justify-start lg:gap-3 lg:text-sm ${
              active ? "bg-accent-soft text-accent" : "text-muted hover:bg-subtle hover:text-foreground"
            }`}
          >
            <Icon size={21} aria-hidden="true" />
            <span className="md:sr-only lg:not-sr-only">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
