import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";

const {
  REALTIME_TICKET_SECRET: ticketSecret,
  REALTIME_PUBLISH_SECRET: publishSecret,
  REALTIME_ALLOWED_ORIGIN: allowedOrigin,
} = process.env;

if (
  !allowedOrigin ||
  !ticketSecret || ticketSecret.length < 32 ||
  !publishSecret || publishSecret.length < 32 ||
  ticketSecret === publishSecret
) {
  throw new Error("Set an allowed origin and two distinct realtime secrets of at least 32 characters.");
}

const uuidPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const idPattern = /^[1-9][0-9]{0,19}$/;
const socketsByUser = new Map();
const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });

function safeEqual(value, expected) {
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function verifyTicket(ticket) {
  if (typeof ticket !== "string") return null;

  const parts = ticket.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;

  const expected = createHmac("sha256", ticketSecret)
    .update(payload)
    .digest("base64url");

  if (!safeEqual(signature, expected)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);

    if (
      typeof claims?.sub !== "string" ||
      !uuidPattern.test(claims.sub) ||
      !Number.isInteger(claims.exp) ||
      claims.exp <= now ||
      claims.exp > now + 60
    ) {
      return null;
    }

    return claims.sub.toLowerCase();
  } catch {
    return null;
  }
}

function json(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    return json(response, 200, { ok: true });
  }

  if (request.method !== "POST" || request.url !== "/publish") {
    return json(response, 404, { error: "Not found" });
  }

  if (!safeEqual(request.headers.authorization ?? "", `Bearer ${publishSecret}`)) {
    return json(response, 401, { error: "Unauthorized" });
  }

  let event;
  try {
    const chunks = [];
    let bytes = 0;

    for await (const chunk of request.iterator({ destroyOnReturn: false })) {
      bytes += chunk.length;
      if (bytes > 4096) {
        request.resume();
        return json(response, 413, { error: "Event too large" });
      }
      chunks.push(chunk);
    }

    event = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return json(response, 400, { error: "Invalid JSON" });
  }

  const { participantIds, conversationId, messageId, recipientId, typing } = event ?? {};
  if (typeof conversationId !== "string" || !idPattern.test(conversationId)) {
    return json(response, 400, { error: "Invalid conversation ID" });
  }

  let recipients;
  let notification;
  if (typeof typing === "boolean" && typeof recipientId === "string" && uuidPattern.test(recipientId)) {
    recipients = [recipientId];
    notification = { type: "conversation.typing", conversationId, typing };
  } else if (
    !Array.isArray(participantIds) ||
    participantIds.length !== 2 ||
    !participantIds.every((id) => typeof id === "string" && uuidPattern.test(id)) ||
    participantIds[0].toLowerCase() === participantIds[1].toLowerCase() ||
    typeof messageId !== "string" || !idPattern.test(messageId)
  ) {
    return json(response, 400, { error: "Invalid message event" });
  } else {
    recipients = participantIds;
    notification = { type: "message.created", conversationId, messageId };
  }

  const frame = JSON.stringify(notification);
  for (const userId of recipients) {
    for (const socket of socketsByUser.get(userId.toLowerCase()) ?? []) {
      if (socket.readyState !== WebSocket.OPEN) continue;
      if (socket.bufferedAmount > 64 * 1024) {
        socket.terminate();
        continue;
      }
      socket.send(frame);
    }
  }

  return json(response, 200, { ok: true });
});

server.on("upgrade", (request, socket, head) => {
  if (request.url !== "/ws" || request.headers.origin !== allowedOrigin) {
    socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    return;
  }

  wss.handleUpgrade(request, socket, head, (connection) => {
    wss.emit("connection", connection);
  });
});

wss.on("connection", (socket) => {
  let userId;
  let sessionTimer;
  socket.alive = true;

  const authTimer = setTimeout(() => socket.close(1008, "Authentication timed out"), 5000);

  socket.on("error", () => socket.terminate());
  socket.on("pong", () => { socket.alive = true; });

  socket.once("message", (data, isBinary) => {
    if (socket.readyState !== WebSocket.OPEN) return;

    try {
      const auth = isBinary ? null : JSON.parse(data.toString());
      userId = auth?.type === "authenticate" ? verifyTicket(auth.ticket) : null;
    } catch {
      userId = null;
    }

    if (!userId) {
      socket.close(1008, "Invalid ticket");
      return;
    }

    clearTimeout(authTimer);
    const sockets = socketsByUser.get(userId) ?? new Set();
    sockets.add(socket);
    socketsByUser.set(userId, sockets);

    // Require a fresh ticket periodically, even on a healthy connection.
    sessionTimer = setTimeout(() => socket.close(1000, "Reconnect with a fresh ticket"), 30 * 60 * 1000);
    socket.send(JSON.stringify({ type: "ready" }));
  });

  socket.on("close", () => {
    clearTimeout(authTimer);
    clearTimeout(sessionTimer);
    const sockets = socketsByUser.get(userId);
    sockets?.delete(socket);
    if (sockets?.size === 0) socketsByUser.delete(userId);
  });
});

setInterval(() => {
  for (const socket of wss.clients) {
    if (socket.readyState !== WebSocket.OPEN) continue;
    if (!socket.alive) {
      socket.terminate();
      continue;
    }
    socket.alive = false;
    socket.ping();
  }
}, 30_000).unref();

server.listen(3001, "0.0.0.0", () => {
  console.log("Realtime server listening on port 3001");
});
