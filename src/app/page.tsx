
'use client';

import { useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";

export default function Home() {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      router.replace("/app");
    }
  }, [user, router]);
 
  if (user) {
    return <p className="p-6 text-muted" role="status">Opening your home…</p>;
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-8 sm:px-6 sm:py-14">
        <section className="editorial-banner w-full px-6 py-12 sm:px-12 sm:py-20 lg:px-20">
          <p className="eyebrow mb-5">Welcome to You</p>
          <h1 className="max-w-4xl font-editorial text-[clamp(2.75rem,9vw,8rem)] leading-[0.93] tracking-[-0.065em]">
            Find your <em className="text-accent">people.</em>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-muted sm:text-lg">
            Make a profile, discover people, and follow the ones you want to hear from.
          </p>
          <Link href="/app" className="button-primary mt-8 inline-flex min-h-11 items-center gap-2 px-5">
            Get started <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </main>
    </>
  );
}
