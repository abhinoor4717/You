import { NextResponse } from "next/server";
import { createRealtimeTicket } from "@/lib/realtime";
import { getCurrentUser } from "@/lib/services/getCurrentUser";

const headers = { "Cache-Control": "private, no-store" };

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to connect." }, { status: 401, headers });

  const connection = createRealtimeTicket(user.uuid);
  if (!connection) return NextResponse.json({ error: "Live messaging is unavailable." }, { status: 503, headers });

  return NextResponse.json(connection, { headers });
}
