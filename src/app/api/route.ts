import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM users");

    return NextResponse.json({
      success: true,
      message: "Connected to MySQL!",
      result: rows,
    });
  } catch (error) {
    console.error("MySQL connection failed:", error);

    return NextResponse.json(
      { success: false, error: "Database connection failed" },
      { status: 500 }
    );
  }
}
