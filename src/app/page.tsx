'use client'

import { useUser } from "@auth0/nextjs-auth0";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const {user, isLoading} = useUser();

  if (isLoading) return "Loading";
  if (user) router.push("/app");

  return (
    <div className="items-center justify-center font-mono flex flex-col h-screen">
      <h1 className="text-8xl" >You</h1>
      <p>Your personal everything dashboard.</p>
      <div className="m-3">
        <a href="/app?screen_hint=signup">
          <button 
          className="bg-white text-black rounded-2xl p-1.5 hover:cursor-pointer hover:bg-slate-200"
          >
            Get started
          </button>
        </a>
      </div>
    </div>
  );
}
