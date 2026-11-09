import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import UserSearchBar from "@/components/UserSearchBar";

export default function App() {
  return (
    <div className="mx-auto grid max-w-2xl gap-8 xl:max-w-none xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-6">
      <section aria-labelledby="home-title" className="min-w-0">
        <p className="eyebrow mb-2">Your community</p>
        <h1 id="home-title" className="mb-5 font-editorial text-5xl leading-none tracking-tight sm:text-6xl">Home</h1>
        <div className="editorial-banner px-6 py-10 sm:px-10 sm:py-14">
          <h2 className="max-w-md font-editorial text-[clamp(2.5rem,5vw,4.5rem)] leading-none tracking-[-0.055em]">
            Find your <em className="text-accent">people.</em>
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted sm:text-base">
            Discover people by name or username and follow the profiles that interest you.
          </p>
          <Link href="/app/search" className="button-primary mt-6 inline-flex min-h-11 items-center gap-2 text-sm">
            Find people <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-divider py-4">
          <div>
            <h2 className="text-sm font-semibold">Your profile</h2>
            <p className="mt-1 text-sm text-muted">See how you appear to other people on You.</p>
          </div>
          <Link href="/app/profile" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent hover:underline">
            View profile <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section
        id="discover"
        aria-labelledby="discover-title"
        className="card hidden min-w-0 self-start p-5 xl:sticky xl:top-20 xl:block"
      >
        <p className="eyebrow mb-2">Discover</p>
        <h2 id="discover-title" className="mb-4 font-editorial text-3xl tracking-tight">Find people</h2>
        <UserSearchBar />
      </section>
    </div>
  );
}
