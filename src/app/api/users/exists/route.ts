import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { User } from "@/types/user";
import { ResultSetHeader } from "mysql2";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const username = request.nextUrl.searchParams.get("username");

  try {
    let users: User[];

    if (email) {
      const [rows] = await pool.query<User[]>(
        "SELECT * FROM users WHERE email = ?",
        [email],
      );

      return NextResponse.json({
        exist: rows.length != 0,
        user: rows[0] ?? null,
      });
    }
    
    if (username) {
        const [rows] = await pool.query<User[]>(
        "SELECT * FROM users WHERE username = ?",
        [username],
      );

      return NextResponse.json({
        exist: rows.length != 0,
        user: rows[0] ?? null,
      });
    }

    return NextResponse.json(
      { success: false, error: "Must provide email to query by!" },
      { status: 500 },
    );
  } catch (error) {
    console.log("MySQL query failed: ", error);

    return NextResponse.json(
      { success: false, error: "Database query failed" },
      { status: 500 },
    );
  }
}
