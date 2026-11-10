import { NextRequest, NextResponse } from "next/server";
import { publishRealtimeEvent } from "@/lib/realtime";
import { findConversationPeer } from "@/lib/services/conversations";
import { getCurrentUser } from "@/lib/services/getCurrentUser";
import { isMessagingId } from "@/lib/services/messages";

export async function POST(request: NextRequest) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return NextResponse.json({ error: "Send typing status as JSON." }, { status: 415 });
  }

  const payload = await request.json().catch(() => null) as { conversationId?: unknown; typing?: unknown } | null;
  const conversationId = payload?.conversationId;
  const typing = payload?.typing;
  if (!isMessagingId(conversationId) || typeof typing !== "boolean") {
    return NextResponse.json({ error: "Invalid typing status." }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to send typing status." }, { status: 401 });

  const recipientId = await findConversationPeer(conversationId, user.uuid);
  if (!recipientId) return NextResponse.json({ error: "Conversation could not be found." }, { status: 404 });

  await publishRealtimeEvent({ recipientId, conversationId, typing });
  return new NextResponse(null, { status: 204 });
}
