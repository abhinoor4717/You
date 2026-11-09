"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { MESSAGE_MAX_LENGTH, type Conversation, type Message, type MessagePage } from "@/types/messaging";
import { requestJson } from "./messaging-api";

const messagesUrl = "/api/conversations/messages";
const timestamp = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function mergeMessages(current: Message[] | null, incoming: Message[]): Message[] {
  const messages = new Map((current ?? []).map((message) => [message.id, message]));
  for (const message of incoming) messages.set(message.id, message);
  return [...messages.values()].sort((a, b) => a.id.length - b.id.length || a.id.localeCompare(b.id));
}

export default function ConversationThread({
  conversation,
  userUuid,
  onBack,
  onSent,
}: {
  conversation: Conversation;
  userUuid: string;
  onBack: () => void;
  onSent: (message: Message) => void;
}) {
  const { id, participant } = conversation;
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [olderError, setOlderError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const transcript = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const followLatest = useRef(true);
  const beforePrepend = useRef<{ height: number; top: number } | null>(null);
  const latestFetched = useRef<string | null>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let loading = false;

    async function refresh() {
      if (loading || document.hidden) return;
      loading = true;
      try {
        const params = new URLSearchParams({ conversationId: id });
        const after = latestFetched.current;
        if (after) params.set("after", after);
        const page = await requestJson<MessagePage>(`${messagesUrl}?${params}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        latestFetched.current = page.messages.at(-1)?.id ?? after;
        if (!after) setOlderCursor(page.hasMore ? page.messages[0].id : null);
        if (!after || page.messages.length) {
          setMessages((current) => mergeMessages(current, page.messages));
        }
        setHistoryError("");
      } catch (error) {
        if (!controller.signal.aborted) {
          setHistoryError(error instanceof Error ? error.message : "Could not load messages.");
        }
      } finally {
        loading = false;
      }
    }

    void refresh();
    const timer = window.setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [id]);

  useLayoutEffect(() => {
    const element = transcript.current;
    if (!element) return;
    const previous = beforePrepend.current;
    if (previous) {
      element.scrollTop = previous.top + element.scrollHeight - previous.height;
      beforePrepend.current = null;
    } else if (followLatest.current) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  async function loadOlder() {
    if (!olderCursor || loadingOlder) return;
    setLoadingOlder(true);
    setOlderError("");
    try {
      const params = new URLSearchParams({ conversationId: id, before: olderCursor });
      const page = await requestJson<MessagePage>(`${messagesUrl}?${params}`);
      const element = transcript.current;
      if (element) beforePrepend.current = { height: element.scrollHeight, top: element.scrollTop };
      setMessages((current) => mergeMessages(current, page.messages));
      setOlderCursor(page.hasMore ? page.messages[0].id : null);
    } catch (error) {
      setOlderError(error instanceof Error ? error.message : "Could not load older messages.");
    } finally {
      setLoadingOlder(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError("");
    try {
      const { message } = await requestJson<{ message: Message }>(messagesUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id, body }),
      });
      followLatest.current = true;
      setMessages((current) => mergeMessages(current, [message]));
      setDraft("");
      onSent(message);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section aria-labelledby="thread-title" className="flex min-w-0 flex-col">
      <div className="flex items-center gap-3 border-b border-divider p-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-subtle md:hidden"
        >
          <ArrowLeft size={19} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h2 id="thread-title" ref={heading} tabIndex={-1} className="break-words font-semibold outline-none">
            {participant.first_name} {participant.last_name}
          </h2>
          <p className="break-words text-xs text-muted">@{participant.username}</p>
        </div>
      </div>

      <div
        ref={transcript}
        role="region"
        aria-label="Message history"
        tabIndex={0}
        className="max-h-[55dvh] min-h-48 flex-1 overflow-y-auto p-4 focus-visible:-outline-offset-2 sm:min-h-72"
        onScroll={(event) => {
          const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
          followLatest.current = scrollHeight - scrollTop - clientHeight < 48;
        }}
      >
        {olderCursor && (
          <button
            type="button"
            onClick={loadOlder}
            disabled={loadingOlder}
            className="mx-auto mb-4 block min-h-10 cursor-pointer rounded-full border border-divider px-4 text-sm text-accent hover:bg-subtle disabled:opacity-60"
          >
            {loadingOlder ? "Loading…" : "Load older messages"}
          </button>
        )}
        {olderError && <p role="alert" className="mb-3 text-sm text-danger">{olderError}</p>}
        {historyError && <p role="alert" className="mb-3 text-sm text-danger">{historyError}</p>}
        {!messages && !historyError && <p role="status" className="text-sm text-muted">Loading messages…</p>}
        {messages?.length === 0 && <p className="text-sm text-muted">No messages yet. Say hello.</p>}
        <ol className="grid gap-4">
          {messages?.map((message) => {
            const own = message.sender_uuid === userUuid;
            return (
              <li key={message.id} className={`max-w-[88%] min-w-0 ${own ? "justify-self-end" : "justify-self-start"}`}>
                <div className={`rounded-2xl px-4 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap ${own ? "bg-accent text-on-accent" : "bg-subtle text-foreground"}`}>
                  <span className="sr-only">{own ? "You: " : `${participant.first_name}: `}</span>
                  {message.body}
                </div>
                <time dateTime={message.created_at} className={`mt-1 block px-1 text-[11px] text-muted ${own ? "text-right" : ""}`}>
                  {timestamp.format(new Date(message.created_at))}
                </time>
              </li>
            );
          })}
        </ol>
      </div>

      <form onSubmit={submit} className="border-t border-divider p-4">
        {sendError && <p role="alert" className="mb-2 text-sm text-danger">{sendError}</p>}
        <div className="flex flex-wrap items-end gap-2">
          <textarea
            aria-label="Message"
            placeholder="Write a message…"
            rows={2}
            maxLength={MESSAGE_MAX_LENGTH}
            value={draft}
            readOnly={sending}
            onChange={(event) => setDraft(event.target.value)}
            className="form-control min-w-32 flex-1 resize-y text-base"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="button-primary inline-flex min-h-11 items-center gap-2 text-sm enabled:cursor-pointer disabled:opacity-60"
          >
            <Send size={16} aria-hidden="true" /> {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
