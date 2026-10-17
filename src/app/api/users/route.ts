
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { User } from "@/types/user";

export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get("email");
    
    try {
        let users: User[];

        if (email) {
            const [rows] = await pool.query<User[]>(
                "SELECT * FROM users WHERE email = ?",
                [email]
            );
            users = rows;
        } else {
            const [rows] = await pool.query<User[]>(
                "SELECT * FROM users"
            );
            users = rows;
        }

        return NextResponse.json({
            result: users
        });
    } catch (error) {
        console.error("MySQL query failed:", error);

        return NextResponse.json(
            { success: false, error: "Database query failed" },
            { status: 500 }
        );
    }
}
