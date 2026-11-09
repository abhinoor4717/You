"use client";

import Image from "next/image";
import dudePic from "@/../public/Dude.webp";
import { useUser } from "../UserProvider";

export default function Profile() {
  const { user } = useUser();

  return (
    <section className="mx-auto max-w-3xl">
      <div aria-hidden="true" className="editorial-banner h-24 sm:h-36" />
      <div className="relative mx-4 -mt-10 sm:mx-8">
        <Image
          src={dudePic}
          alt="Profile picture"
          className="size-20 rounded-full border-4 border-background bg-subtle object-cover sm:size-24"
        />
        <p className="eyebrow mt-4">Your profile</p>
        <h1 className="mt-2 break-words font-editorial text-4xl leading-none tracking-tight sm:text-5xl">
          {user.first_name} {user.last_name}
        </h1>
        <p className="mt-2 break-words text-sm text-muted">@{user.username}</p>

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y border-divider py-4">
          <div className="flex items-baseline gap-2">
            <dt className="order-last text-sm text-muted">Followers</dt>
            <dd className="font-semibold">{user.followers_count}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="order-last text-sm text-muted">Following</dt>
            <dd className="font-semibold">{user.following_count}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
