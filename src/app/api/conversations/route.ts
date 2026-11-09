import { NextRequest, NextResponse } from "next/server";
import { createConversation, findConversations, findSpecificConversation, parseInboxCursor } from "@/lib/services/conversations";
import { getCurrentUser } from "@/lib/services/getCurrentUser";

const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const privateHeaders = { "Cache-Control": "private, no-store" };

function failure(error: string, status: number) {
  return NextResponse.json({ status: false, error }, { status, headers: privateHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return failure("Sign in to view your conversations.", 401);

    const uuid = request.nextUrl.searchParams.get("uuid");
    if (uuid !== null) {
      if (!uuidPattern.test(uuid)) return failure("Invalid user.", 400);

      const conversation = await findSpecificConversation(user.uuid, uuid);
      return NextResponse.json({ status: true, conversation }, { headers: privateHeaders });
    }

    const rawCursor = request.nextUrl.searchParams.get("cursor");
    const cursor = rawCursor === null ? null : parseInboxCursor(rawCursor);
    if (rawCursor !== null && !cursor) return failure("Invalid inbox cursor.", 400);

    const page = await findConversations(user.uuid, cursor);
    return NextResponse.json({ status: true, ...page }, { headers: privateHeaders });
  } catch (error) {
    console.error("Error loading conversations:", error);
    return failure("Could not load your conversations.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return failure("Sign in to start a conversation.", 401);

    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
      return failure("Send the recipient as JSON.", 415);
    }
    const payload: unknown = await request.json().catch(() => null);
    const uuid = typeof payload === "object" && payload !== null && "uuid" in payload ? payload.uuid : null;
    if (typeof uuid !== "string" || !uuidPattern.test(uuid)) return failure("Invalid user.", 400);
    if (uuid.toLowerCase() === user.uuid.toLowerCase()) return failure("Choose someone other than yourself.", 400);

    const conversation = await createConversation(user.uuid, uuid);
    if (!conversation) return failure("That person could not be found.", 404);

    return NextResponse.json(
      { status: true, conversation, data: { insertId: conversation.id } },
      { headers: privateHeaders }
    );
  } catch (error) {
    console.error("Error opening conversation:", error);
    return failure("Could not open that conversation.", 500);
  }
}
