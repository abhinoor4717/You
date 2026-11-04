import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { PublicUser, User } from "@/types/user";
import { ResultSetHeader } from "mysql2";
import { getUserByEmail, getUserByUsername, getUserByUuid } from "@/lib/services/getUser";

export async function GET(request: NextRequest) {
  const uuid = request.nextUrl.searchParams.get("uuid");
  const email = request.nextUrl.searchParams.get("email");
  const username = request.nextUrl.searchParams.get("username");

  try {
    let user: PublicUser | null;
    if (uuid) {
      user = await getUserByUuid(uuid);
    } else if (email) {
      user = await getUserByEmail(email);
    } else if (username) {
      user = await getUserByUsername(username);
    } else {
      return NextResponse.json(
        { success: false, error: "Must provide one field(uuid, email, username) to query by!" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      exist: user != null,
      user: user
    });
  } catch (error) {
    console.log("MySQL query failed: ", error);

    return NextResponse.json(
      { success: false, error: "Database query failed" },
      { status: 500 },
    );
  }
}
