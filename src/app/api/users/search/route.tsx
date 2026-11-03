import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { User } from "@/types/user";
import { ResultSetHeader } from "mysql2";

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("q");

    try {
        if (query) {
            const [rows] = await pool.query<User[]>(
                "SELECT * FROM users WHERE first_name LIKE ? OR last_name LIKE ? OR username LIKE ?",
                [`%${query}%`, `%${query}%`, `%${query}%`]
            );

            return NextResponse.json(
                { 
                    users: rows
                }
            );

        } else {
            return NextResponse.json(
                {success: false, error: "Must provide query!"},
                {status: 500}
            );
        }
    } catch (error) {
        console.log("MySQL query failed: ", error);

        return NextResponse.json(
            { success: false, error: "Database query failed" },
            { status: 500 }
        );
    }
}