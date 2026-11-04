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
            <h1 className="text-3xl font-black text-[#262044]">
              {user.first_name} {user.last_name}
            </h1>
            <p className="mt-1 font-mono text-sm text-violet-700">
              @{user.username}
            </p>
            <button
              type="button"
              onClick={toggleFollow}
              disabled={followPending}
              className={`border-2 border-[#262044] px-4 py-2 font-mono text-sm font-bold text-[#262044] shadow-[3px_3px_0_#262044] disabled:cursor-wait disabled:opacity-60 ${isFollowing ? "bg-lime-200 hover:bg-lime-100" : "bg-pink-300 hover:bg-pink-200"
                }`}
            >
              {followPending ? "Saving..." : isFollowing ? "Unfollow" : "+ Follow"}
            </button>

            {followError && (
              <p role="alert" className="mt-2 font-mono text-xs text-pink-700">
                {followError}
              </p>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:ml-auto">
            <div className="border-2 border-[#262044] bg-cyan-100 px-5 py-3 text-center shadow-[3px_3px_0_#262044]">
              <dd className="text-2xl font-black">{user.followers.length}</dd>
              <dt className="font-mono text-xs font-bold uppercase">
                Followers
              </dt>
            </div>
            <div className="border-2 border-[#262044] bg-pink-100 px-5 py-3 text-center shadow-[3px_3px_0_#262044]">
              <dd className="text-2xl font-black">{user.following.length}</dd>
              <dt className="font-mono text-xs font-bold uppercase">
                Following
              </dt>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
