"use client";

import Image from "next/image";
import dudePic from "@/../public/Dude.webp";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PublicUser } from "@/types/user";
import { useUser } from "../../UserProvider";
import { ApiResponse } from "@/types/apiResponse";
import { FollowData } from "@/app/api/follows/route";

export default function ProfileDynamic() {
  const router = useRouter();
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useUser();

  const [user, setUser] = useState<PublicUser | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [followError, setFollowError] = useState("");

  useEffect(() => {
  const controller = new AbortController();

  if (currentUser?.username === username) {
    router.replace("/app/profile");
    return () => controller.abort();
  }

  async function fetchUser() {
    try {
      setLoading(true);

      const userRes = await fetch(
        `/api/users/exists?username=${encodeURIComponent(username)}`,
        { signal: controller.signal }
      );

      if (!userRes.ok) throw new Error("Failed to fetch profile.");

      const userResult: { exist: boolean; user?: PublicUser } =
        await userRes.json();

      if (!userResult.exist || !userResult.user) {
        router.replace("/app");
        return;
      }

      const profile = userResult.user;

      const followsRes = await fetch(
        `/api/follows?uuid=${encodeURIComponent(profile.uuid)}`,
        { signal: controller.signal }
      );

      const followsResult: ApiResponse<FollowData> = await followsRes.json();

      if (!followsRes.ok || !followsResult.data) {
        throw new Error("Failed to fetch follow data.");
      }

      setUser({
        ...profile,
        followers: followsResult.data.followers,
        following: followsResult.data.followings,
      });

      setIsFollowing(
        currentUser
          ? followsResult.data.followers.includes(currentUser.uuid)
          : false
      );
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("Error fetching profile:", error);
        router.replace("/app");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  void fetchUser();

  return () => controller.abort();
}, [username, router, currentUser?.uuid, currentUser?.username]);

async function toggleFollow() {
  if (!user || !currentUser || followPending) return;

  const nextFollowing = !isFollowing;
  setFollowPending(true);
  setFollowError("");

  try {
    const res = await fetch("/api/follows", {
      method: nextFollowing ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followed_uuid: user.uuid }),
    });

    if (!res.ok) throw new Error("Could not update follow status.");

    setIsFollowing(nextFollowing);

    setUser((current) => {
      if (!current) return current;

      const followers = nextFollowing
        ? [...new Set([...current.followers, currentUser.uuid])]
        : current.followers.filter((uuid) => uuid !== currentUser.uuid);

      return { ...current, followers };
    });
  } catch (error) {
    setFollowError(
      error instanceof Error ? error.message : "Something went wrong."
    );
  } finally {
    setFollowPending(false);
  }
}

  if (loading) return <p>Loading…</p>;
  if (!user) return null;

  return (
    <section className="mx-auto max-w-3xl">
      <div aria-hidden="true" className="editorial-banner h-24 sm:h-36" />
      <div className="relative mx-4 -mt-10 sm:mx-8">
        <Image
          src={dudePic}
          alt="Profile picture"
          className="size-20 rounded-full border-4 border-background bg-subtle object-cover sm:size-24"
        />

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">Profile</p>
            <h1 className="mt-2 break-words font-editorial text-4xl leading-none tracking-tight sm:text-5xl">
              {user.first_name} {user.last_name}
            </h1>
            <p className="mt-2 break-words text-sm text-muted">
              @{user.username}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleFollow}
            disabled={followPending}
            className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold enabled:cursor-pointer disabled:cursor-wait disabled:opacity-60 ${
              isFollowing ? "bg-subtle text-foreground hover:bg-accent-soft" : "bg-accent text-on-accent hover:bg-accent-hover"
            }`}
          >
            {followPending ? "Saving..." : isFollowing ? "Unfollow" : "+ Follow"}
          </button>
        </div>
        {followError && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {followError}
          </p>
        )}

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-y border-divider py-4">
          <div className="flex items-baseline gap-2">
            <dt className="order-last text-sm text-muted">Followers</dt>
            <dd className="font-semibold">{user.followers.length}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="order-last text-sm text-muted">Following</dt>
            <dd className="font-semibold">{user.following.length}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
