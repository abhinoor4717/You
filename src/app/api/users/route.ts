import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { User } from "@/types/user";
import { ResultSetHeader } from "mysql2";

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

export async function POST(request: NextRequest) {
    try {
        const body: User = await request.json();

        const [result] =  await pool.execute<ResultSetHeader>("INSERT INTO users (first_name, last_name, username, email, birthday) VALUES (?, ?, ?, ?, ?)", 
            [body.first_name, body.last_name, body.username, body.email, body.birthday]
        );
            
        return NextResponse.json({message: "Success", data: {insertId: result.insertId}}, {status: 201});

    } catch (error) {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const uuid = request.nextUrl.searchParams.get("uuid");

    try {
        const [result] = await pool.execute<ResultSetHeader>("DELETE FROM users WHERE uuid = ?", [uuid])
        if (result.affectedRows === 0) {
            return NextResponse.json({
                success: false, message: "No user found with that uuid."
            });
        }

        return NextResponse.json({ success: true, message: "User deleted successfully!" });
    } catch (error) {
        console.error("Database error: ", error);
        return NextResponse.json({ success: false, message: "Failed to delete row." });
    }
}