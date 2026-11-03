
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
    <div className="flex gap-2 h-screen flex-col items-center justify-center font-mono">
      <h1 className="text-8xl">You</h1>
      <p>Your personal everything dashboard.</p>

      <div className="m-3">
        <Link
          href="/app"
          className="pixel-link pixel-link-active flex items-center gap-3 px-3 py-3 font-mono text-sm"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
