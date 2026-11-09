import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { UserSummary } from "@/types/user";
import type { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("q");

    try {
        if (query) {
            const name = `%${query}%`;
            const handle = `%${query.replace(/^@/, "")}%`;
            const [rows] = await pool.query<(UserSummary & RowDataPacket)[]>(
                `SELECT uuid, first_name, last_name, username FROM users
                 WHERE CONCAT(first_name, ' ', last_name) LIKE ? OR username LIKE ?
                 ORDER BY username LIMIT 20`,
                [name, handle]
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
