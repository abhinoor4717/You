"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
import UserSearchBar from "@/components/UserSearchBar";
import type { Conversation, ConversationPage, Message } from "@/types/messaging";
import type { UserSummary } from "@/types/user";
import { useUser } from "../UserProvider";
import ConversationThread from "./ConversationThread";
import { requestJson } from "./messaging-api";

const inboxUrl = "/api/conversations";

type Inbox = ConversationPage & { loadedOlder: boolean };

function mergeConversations(first: Conversation[], second: Conversation[]) {
  const ids = new Set(first.map(({ id }) => id));
  return [...first, ...second.filter(({ id }) => !ids.has(id))];
}

export default function Messages() {
  const { user } = useUser();
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [opening, setOpening] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [openError, setOpenError] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState("");
  const olderRequest = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const conversations = inbox?.conversations;
  const selected = conversations?.find(({ id }) => id === activeConversation?.id) ?? activeConversation;

  useEffect(() => {
    const controller = new AbortController();
    let loading = false;

    async function loadInbox() {
      if (loading || olderRequest.current || document.hidden) return;
      loading = true;
      const currentRevision = revision.current;
      try {
        const data = await requestJson<ConversationPage>(inboxUrl, { signal: controller.signal });
        if (!controller.signal.aborted && revision.current === currentRevision) {
          setInbox((current) => current?.loadedOlder
            ? { ...current, conversations: mergeConversations(data.conversations, current.conversations) }
            : { ...data, loadedOlder: false });
          setLoadError("");
        }
      } catch (error) {
        if (!controller.signal.aborted && revision.current === currentRevision) {
          setLoadError(error instanceof Error ? error.message : "Could not load conversations.");
        }
      } finally {
        loading = false;
      }
    }

    void loadInbox();
    const timer = window.setInterval(loadInbox, 10000);
    document.addEventListener("visibilitychange", loadInbox);
    return () => {
      controller.abort();
      olderRequest.current?.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", loadInbox);
    };
  }, []);

  async function loadOlderConversations() {
    const cursor = inbox?.nextCursor;
    if (!cursor || olderRequest.current) return;

    const controller = new AbortController();
    olderRequest.current = controller;
    revision.current++;
    setLoadingOlder(true);
    setOlderError("");
    try {
      const data = await requestJson<ConversationPage>(`${inboxUrl}?cursor=${encodeURIComponent(cursor)}`, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setInbox((current) => ({
        ...data,
        conversations: mergeConversations(current?.conversations ?? [], data.conversations),
        loadedOlder: true,
      }));
    } catch (error) {
      if (!controller.signal.aborted) {
        setOlderError(error instanceof Error ? error.message : "Could not load older conversations.");
      }
    } finally {
      olderRequest.current = null;
      if (!controller.signal.aborted) setLoadingOlder(false);
    }
  }

  function selectConversation(conversation: Conversation) {
    setActiveConversation(conversation);
    setShowSearch(false);
    setOpenError("");
  }

  async function openConversation(person: UserSummary) {
    if (opening) return;
    setOpening(true);
    setOpenError("");
    try {
      const { conversation } = await requestJson<{ conversation: Conversation }>(inboxUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: person.uuid }),
      });
      revision.current++;
      setInbox((current) => ({
        nextCursor: current?.nextCursor ?? null,
        loadedOlder: current?.loadedOlder ?? false,
        conversations: mergeConversations([conversation], current?.conversations ?? []),
      }));
      selectConversation(conversation);
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : "Could not open that conversation.");
    } finally {
      setOpening(false);
    }
  }

  function updatePreview(message: Message) {
    revision.current++;
    setInbox((current) => {
      const conversation = current?.conversations.find(({ id }) => id === message.conversation_id) ?? selected;
      if (!current || conversation?.id !== message.conversation_id || conversation.updated_at > message.created_at) return current;
      const updated = { ...conversation, last_message: message.body, updated_at: message.created_at };
      return { ...current, conversations: mergeConversations([updated], current.conversations) };
    });
  }

  return (
    <section aria-labelledby="messages-title" className="mx-auto max-w-5xl">
      <p className="eyebrow mb-2">Inbox</p>
      <h1 id="messages-title" className="mb-6 font-editorial text-5xl leading-none tracking-tight sm:text-6xl">
        Messages
      </h1>

      <div className="card grid min-w-0 md:grid-cols-[minmax(13rem,1fr)_minmax(0,2fr)]">
        <section
          aria-labelledby="conversations-title"
          className={`min-w-0 md:block md:border-r md:border-divider ${selected ? "hidden" : ""}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-divider p-4">
            <h2 id="conversations-title" className="text-sm font-semibold">Conversations</h2>
            <button
              type="button"
              onClick={() => {
                setShowSearch(!showSearch);
                setOpenError("");
              }}
              aria-expanded={showSearch}
              disabled={opening}
              className="button-primary inline-flex min-h-10 cursor-pointer items-center gap-1 text-xs disabled:opacity-60"
            >
              <Plus size={16} aria-hidden="true" /> New message
            </button>
          </div>
          {showSearch && (
            <div className="max-h-72 overflow-y-auto border-b border-divider p-4">
              <UserSearchBar
                focusOnMount
                excludeUserId={user.uuid}
                onSelectUser={openConversation}
                selectionPending={opening}
              />
              {opening && <p className="mt-2 text-sm text-muted" role="status">Opening conversation…</p>}
              {openError && <p className="mt-2 text-sm text-danger" role="alert">{openError}</p>}
            </div>
          )}
          {loadError && <p className="p-4 text-sm text-danger" role="alert">{loadError}</p>}
          {!conversations && !loadError && <p className="p-4 text-sm text-muted" role="status">Loading inbox…</p>}
          {conversations?.length === 0 && (
            <p className="p-4 text-sm text-muted">Start a conversation with New message.</p>
          )}
          {conversations && (
            <ul className="max-h-112 divide-y divide-divider overflow-y-auto">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    aria-pressed={conversation.id === selected?.id}
                    disabled={opening}
                    onClick={() => selectConversation(conversation)}
                    className={`block w-full cursor-pointer px-4 py-3 text-left focus-visible:-outline-offset-2 ${
                      conversation.id === selected?.id ? "bg-accent-soft" : "hover:bg-subtle"
                    }`}
                  >
                    <span className="block truncate text-sm font-semibold">
                      {conversation.participant.first_name} {conversation.participant.last_name}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted">
                      {conversation.last_message ?? `@${conversation.participant.username}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {inbox?.nextCursor && (
            <button
              type="button"
              onClick={loadOlderConversations}
              disabled={loadingOlder}
              className="w-full border-t border-divider px-4 py-3 text-sm font-semibold text-accent enabled:cursor-pointer enabled:hover:bg-subtle disabled:opacity-60"
            >
              {loadingOlder ? "Loading…" : "Load older conversations"}
            </button>
          )}
          {olderError && <p className="p-4 text-sm text-danger" role="alert">{olderError}</p>}
        </section>

        {selected ? (
          <ConversationThread
            key={selected.id}
            conversation={selected}
            userUuid={user.uuid}
            onBack={() => setActiveConversation(null)}
            onSent={updatePreview}
          />
        ) : (
          <div className="hidden min-h-96 place-content-center justify-items-center gap-3 p-6 text-center text-muted md:grid">
            <MessageSquare size={28} className="text-accent" aria-hidden="true" />
            <p className="text-sm">Choose a conversation or start a new one.</p>
          </div>
        )}
      </div>
    </section>
  );
}
