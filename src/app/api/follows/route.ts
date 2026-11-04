import { NextResponse, type NextRequest } from "next/server";
import type { ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { getFollowers, getFollowings } from "@/lib/services/getUser";
import { getCurrentUser } from "@/lib/services/getCurrentUser";
import type { ApiResponse } from "@/types/apiResponse";

export interface FollowData {
  followers: string[];
  followings: string[];
}

type RouteResponse<T> = Promise<NextResponse<ApiResponse<T>>>;

function success<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null }, { status });
}

function failure<T>(
  status: number,
  code: string,
  message: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { data: null, error: { code, message } },
    { status }
  );
}

async function readFollowedUuid(request: NextRequest): Promise<string | null> {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("followed_uuid" in body) ||
      typeof body.followed_uuid !== "string" ||
      body.followed_uuid.trim() === ""
    ) {
      return null;
    }

    return body.followed_uuid.trim();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest): RouteResponse<FollowData> {
  const uuid = request.nextUrl.searchParams.get("uuid");

  if (!uuid) {
    return failure(400, "MISSING_UUID", "uuid is required for lookup");
  }

  try {
    const [followers, followings] = await Promise.all([
      getFollowers(uuid),
      getFollowings(uuid),
    ]);

    // These helpers return null on failure, so Promise.all won't reject.
    if (followers === null || followings === null) {
      return failure(500, "FOLLOW_LOOKUP_FAILED", "Unable to retrieve follow data");
    }

    return success({ followers, followings });
  } catch (error) {
    console.error("Error retrieving follow data:", error);
    return failure(500, "INTERNAL_ERROR", "An unexpected error occurred");
  }
}

interface FollowMutation {
  followed_uuid: string;
}

export async function POST(request: NextRequest): RouteResponse<FollowMutation> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return failure(401, "UNAUTHORIZED", "You must be logged in");
    }

    const followedUuid = await readFollowedUuid(request);

    if (!followedUuid) {
      return failure(400, "MISSING_FOLLOWED_UUID", "followed_uuid is required");
    }

    if (followedUuid === user.uuid) {
      return failure(400, "SELF_FOLLOW", "You cannot follow yourself");
    }

    await pool.query<ResultSetHeader>(
      "INSERT INTO follows (follower_uuid, followed_uuid) VALUES (?, ?)",
      [user.uuid, followedUuid]
    );

    return success({ followed_uuid: followedUuid }, 201);
  } catch (error) {
    console.error("Error creating follow:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return failure(409, "ALREADY_FOLLOWING", "You already follow this user");
    }

    return failure(500, "INTERNAL_ERROR", "Unable to create follow");
  }
}

export async function DELETE(
  request: NextRequest
): RouteResponse<FollowMutation> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return failure(401, "UNAUTHORIZED", "You must be logged in");
    }

    const followedUuid = await readFollowedUuid(request);

    if (!followedUuid) {
      return failure(400, "MISSING_FOLLOWED_UUID", "followed_uuid is required");
    }

    await pool.query<ResultSetHeader>(
      "DELETE FROM follows WHERE follower_uuid = ? AND followed_uuid = ?",
      [user.uuid, followedUuid]
    );

    return success({ followed_uuid: followedUuid });
  } catch (error) {
    console.error("Error deleting follow:", error);
    return failure(500, "INTERNAL_ERROR", "Unable to delete follow");
  }
}