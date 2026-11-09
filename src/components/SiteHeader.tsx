import Link from "next/link";
import { ChevronDown, SunMoon, UserRound } from "lucide-react";
import ThemePicker from "./ThemePicker";

export default function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const MenuIcon = signedIn ? UserRound : SunMoon;

  return (
    <header className="site-header sticky top-0 z-30 flex items-center border-b border-divider bg-background">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href={signedIn ? "/app" : "/"}
          aria-label="You home"
          className="font-editorial text-4xl font-bold leading-none tracking-[-0.08em]"
        >
          You<span className="text-accent">.</span>
        </Link>

        <details className="group relative">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-divider bg-surface px-3 text-sm font-semibold hover:border-control [&::-webkit-details-marker]:hidden">
            <MenuIcon size={17} aria-hidden="true" />
            {signedIn ? "Account" : "Theme"}
            <ChevronDown size={14} className="group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="card absolute right-0 top-full mt-2 w-56 space-y-3 p-3 shadow-lg">
            <ThemePicker />
            {signedIn && (
              <div className="grid gap-1 border-t border-divider pt-2 text-sm">
                <Link href="/app/profile" className="rounded-lg px-2 py-2 hover:bg-subtle">
                  Your profile
                </Link>
                <Link href="/auth/logout" className="rounded-lg px-2 py-2 hover:bg-subtle">
                  Log out
                </Link>
              </div>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}
