'use client'

import Image from "next/image";
import dudePic from "@/../public/Dude.webp";
import { useUser } from "../UserProvider";

export default function Profile() {
    const { user } = useUser();

  return (
    <section className="mx-auto max-w-3xl p-6 md:p-10">
  <div className="pixel-panel relative overflow-hidden p-6 md:p-8">
    <div aria-hidden="true" className="absolute right-5 top-5 flex gap-2">
      <span className="size-3 bg-pink-400" />
      <span className="size-3 bg-cyan-400" />
      <span className="size-3 bg-lime-400" />
    </div>

    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <Image
        src={dudePic}
        alt="Profile picture"
        className="size-24 border-4 border-[#262044] bg-cyan-100 shadow-[4px_4px_0_#f472b6]"
      />

      <div>
        <p className="mb-2 inline-block bg-violet-200 px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider">
          Your profile
        </p>
        <h1 className="text-3xl font-black text-[#262044]">{user.first_name} {user.last_name}</h1>
        <p className="mt-1 font-mono text-sm text-violet-700">@{user.username}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:ml-auto">
        <div className="border-2 border-[#262044] bg-cyan-100 px-5 py-3 text-center shadow-[3px_3px_0_#262044]">
          <dd className="text-2xl font-black">{user.followers_count}</dd>
          <dt className="font-mono text-xs font-bold uppercase">Followers</dt>
        </div>
        <div className="border-2 border-[#262044] bg-pink-100 px-5 py-3 text-center shadow-[3px_3px_0_#262044]">
          <dd className="text-2xl font-black">{user.following_count}</dd>
          <dt className="font-mono text-xs font-bold uppercase">Following</dt>
        </div>
      </dl>
    </div>
  </div>
</section>
  );
}