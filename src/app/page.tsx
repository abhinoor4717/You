
'use client';

import { useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (user) {
      router.replace("/app");
    }
  }, [user, router]);

  if (isLoading || user) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center font-mono">
      <h1 className="text-8xl">You</h1>
      <p>Your personal everything dashboard.</p>

      <div className="m-3">
        <Link
          href="/app?screen_hint=signup"
          className="rounded-2xl bg-white p-1.5 text-black hover:bg-slate-200"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
