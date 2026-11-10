"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TYPING_TIMEOUT_MS } from "@/types/messaging";
import type { RealtimeConnection } from "./useRealtime";

const typingRefreshMs = 2000;

export function useTyping(conversationId: string, { connected, subscribe }: RealtimeConnection) {
  const [peerTyping, setPeerTyping] = useState(false);
  const outbound = useRef({
    lastStart: null as number | null,
    pending: null as boolean | null,
    sending: false,
  });

  const signalTyping = useCallback((typing: boolean) => {
    const status = outbound.current;
    const now = Date.now();
    if (typing) {
      if (status.lastStart !== null && now - status.lastStart < typingRefreshMs) return;
      status.lastStart = now;
    } else {
      if (status.lastStart === null) return;
      status.lastStart = null;
    }

    status.pending = typing;
    if (status.sending) return;

    async function flush() {
      status.sending = true;
      while (status.pending !== null) {
        const next = status.pending;
        status.pending = null;
        try {
          await fetch("/api/conversations/typing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId, typing: next }),
            keepalive: !next,
            signal: AbortSignal.timeout(3000),
          });
        } catch {
          // The recipient's indicator expires even if a signal is lost.
        }
      }
      status.sending = false;
    }

    void flush();
  }, [conversationId]);

  useEffect(() => {
    let expiry: number | undefined;
    const unsubscribe = subscribe((event) => {
      if (event.conversationId !== conversationId || event.type !== "conversation.typing") return;
      window.clearTimeout(expiry);
      setPeerTyping(event.typing);
      if (event.typing) expiry = window.setTimeout(() => setPeerTyping(false), TYPING_TIMEOUT_MS);
    });
    return () => {
      unsubscribe();
      window.clearTimeout(expiry);
      signalTyping(false);
    };
  }, [conversationId, signalTyping, subscribe]);

  return {
    peerTyping: connected && peerTyping,
    draftChanged: (draft: string) => {
      if (!draft.trim()) signalTyping(false);
      else if (connected) signalTyping(true);
    },
    stopTyping: () => signalTyping(false),
  };
}
