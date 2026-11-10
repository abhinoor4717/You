"use client";

import { useCallback, useEffect, useState } from "react";

type RealtimeEvent = {
  conversationId: string;
} & (
  | { type: "message.created" }
  | { type: "conversation.typing"; typing: boolean }
);

type Listener = (event: RealtimeEvent) => void;

export function useRealtime() {
  const [connected, setConnected] = useState(false);
  const [listeners] = useState(() => new Set<Listener>());

  const subscribe = useCallback((listener: Listener) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, [listeners]);

  useEffect(() => {
    const controller = new AbortController();
    let socket: WebSocket | undefined;
    let reconnectTimer: number | undefined;
    let handshakeTimer: number | undefined;
    let delay = 1000;

    function reconnect() {
      if (controller.signal.aborted) return;
      reconnectTimer = window.setTimeout(connect, delay);
      delay = Math.min(delay * 2, 30_000);
    }

    async function connect() {
      try {
        const response = await fetch("/api/realtime/ticket", {
          method: "POST",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
        });
        if (response.status === 401 || response.status === 503) return;
        if (!response.ok) throw new Error("Could not get a realtime ticket");

        const { ticket, url } = await response.json();
        if (controller.signal.aborted) return;
        const connection = new WebSocket(url);
        socket = connection;
        handshakeTimer = window.setTimeout(() => connection.close(), 8000);

        connection.addEventListener("open", () => {
          connection.send(JSON.stringify({ type: "authenticate", ticket }));
        });
        connection.addEventListener("message", ({ data }) => {
          if (controller.signal.aborted || typeof data !== "string") return;
          let event;
          try {
            event = JSON.parse(data);
          } catch {
            return;
          }
          if (event?.type === "ready") {
            window.clearTimeout(handshakeTimer);
            delay = 1000;
            setConnected(true);
          } else if (typeof event?.conversationId === "string" && (
            event.type === "message.created" ||
            (event.type === "conversation.typing" && typeof event.typing === "boolean")
          )) {
            for (const listener of listeners) listener(event);
          }
        });
        connection.addEventListener("close", () => {
          if (controller.signal.aborted) return;
          window.clearTimeout(handshakeTimer);
          setConnected(false);
          reconnect();
        }, { once: true });
      } catch {
        reconnect();
      }
    }

    void connect();
    return () => {
      controller.abort();
      window.clearTimeout(reconnectTimer);
      window.clearTimeout(handshakeTimer);
      socket?.close();
    };
  }, [listeners]);

  return { connected, subscribe };
}

export type RealtimeConnection = ReturnType<typeof useRealtime>;
