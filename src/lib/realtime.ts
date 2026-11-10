import { createHmac } from "node:crypto";

const development = process.env.NODE_ENV === "development";

export function createRealtimeTicket(userUuid: string) {
  const secret = process.env.REALTIME_TICKET_SECRET;
  const url = process.env.REALTIME_SOCKET_URL || (development ? "ws://127.0.0.1:3001/ws" : "");
  if (!secret || secret.length < 32 || !url) return null;

  const payload = Buffer.from(JSON.stringify({
    sub: userUuid,
    exp: Math.floor(Date.now() / 1000) + 60,
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return { ticket: `${payload}.${signature}`, url };
}

type Publication = { conversationId: string } & (
  | { participantIds: [string, string]; messageId: string }
  | { recipientId: string; typing: boolean }
);

export async function publishRealtimeEvent(event: Publication) {
  const secret = process.env.REALTIME_PUBLISH_SECRET;
  const url = process.env.REALTIME_PUBLISH_URL || (development ? "http://127.0.0.1:3001/publish" : "");
  if (!secret || !url) return;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) console.warn("Realtime publish rejected", response.status);
  } catch {
    console.warn("Realtime publish unavailable");
  }
}
