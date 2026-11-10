import { after, NextRequest, NextResponse } from "next/server";
import { publishRealtimeEvent } from "@/lib/realtime";
import { getCurrentUser } from "@/lib/services/getCurrentUser";
import { getMessages, isMessagingId, sendMessage } from "@/lib/services/messages";
import { MESSAGE_MAX_LENGTH } from "@/types/messaging";

const privateHeaders = { "Cache-Control": "private, no-store" };

function failure(error: string, status: number) {
  return NextResponse.json({ status: false, error }, { status, headers: privateHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return failure("Sign in to read messages.", 401);

    const params = request.nextUrl.searchParams;
    const conversationId = params.get("conversationId");
    const before = params.get("before");
    const after = params.get("after");
    if (!isMessagingId(conversationId) || (before !== null && !isMessagingId(before)) ||
      (after !== null && !isMessagingId(after)) || (before && after)) {
      return failure("Invalid conversation or message cursor.", 400);
    }

    const page = await getMessages(conversationId, user.uuid, before, after);
    if (!page) return failure("Conversation could not be found.", 404);

    return NextResponse.json({ status: true, ...page }, { headers: privateHeaders });
  } catch (error) {
    console.error("Error reading messages:", error);
    return failure("Could not load messages.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return failure("Sign in to send messages.", 401);

    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
      return failure("Send the message as JSON.", 415);
    }
    const payload = await request.json().catch(() => null) as { conversationId?: unknown; body?: unknown } | null;
    const conversationId = payload?.conversationId;
    const body = typeof payload?.body === "string" ? payload.body.trim() : "";
    if (!isMessagingId(conversationId)) return failure("Invalid conversation.", 400);
    if (!body || body.length > MESSAGE_MAX_LENGTH) {
      return failure(`Enter a message between 1 and ${MESSAGE_MAX_LENGTH} characters.`, 400);
    }

    const saved = await sendMessage(conversationId, user.uuid, body);
    if (!saved) return failure("Conversation could not be found.", 404);

    const { message, participantIds } = saved;
    after(() => publishRealtimeEvent({ participantIds, conversationId, messageId: message.id }));
    return NextResponse.json({ status: true, message }, { status: 201, headers: privateHeaders });
  } catch (error) {
    console.error("Error sending message:", error);
    return failure("Could not send your message.", 500);
  }
}
