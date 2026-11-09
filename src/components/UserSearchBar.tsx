"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { UserSummary } from "@/types/user";

type SearchResult = { users: UserSummary[]; error?: string };

type SearchProps = {
  focusOnMount?: boolean;
  excludeUserId?: string;
  onSelectUser?: (user: UserSummary) => void;
  selectionPending?: boolean;
};

export default function UserSearchBar({
  focusOnMount = false,
  excludeUserId,
  onSelectUser,
  selectionPending = false,
}: SearchProps) {
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const resultsId = useId();
  const searchTerm = query.trim();
  const showResults = searchTerm.length >= 2;

  useEffect(() => {
    if (focusOnMount) input.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  useEffect(() => {
    if (!showResults) return;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchTerm)}`,
          { signal: controller.signal }
        );

        if (!response.ok) throw new Error("Search failed");

        const data: { users: UserSummary[] } = await response.json();
        if (!controller.signal.aborted) setResult({ users: data.users });
      } catch {
        if (!controller.signal.aborted) {
          setResult({ users: [], error: "Could not load users. Try again." });
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchTerm, showResults]);

  const users = result?.users.filter((user) => user.uuid !== excludeUserId) ?? [];

  return (
    <div role="search" aria-label="People search">
      <div className="flex items-center gap-2 rounded-xl border border-control bg-background px-3 focus-within:ring-2 focus-within:ring-accent">
        <Search size={18} className="shrink-0 text-accent" aria-hidden="true" />

        <input
          ref={input}
          type="search"
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            if (nextQuery.trim() !== searchTerm) setResult(null);
            setQuery(nextQuery);
          }}
          placeholder="Name or username"
          aria-label="Search users"
          aria-controls={showResults ? resultsId : undefined}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-foreground outline-none placeholder:text-muted sm:text-sm"
        />
      </div>

      {showResults && (
        <div
          id={resultsId}
          className="mt-3 divide-y divide-divider border-y border-divider"
          role="region"
          aria-label="Search results"
        >
          {!result ? (
            <p className="p-4 text-sm text-muted" role="status">
              Searching…
            </p>
          ) : result.error ? (
            <p className="p-4 text-sm text-danger" role="alert">
              {result.error}
            </p>
          ) : users.length === 0 ? (
            <p className="p-4 text-sm text-muted" role="status">
              No people found.
            </p>
          ) : (
            <ul>
              {users.map((user) => {
                const label = (
                  <>
                    <span className="block font-bold text-foreground">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="text-sm text-muted">
                      @{user.username}
                    </span>
                  </>
                );
                const className = "block w-full px-2 py-3 text-left break-words hover:bg-subtle";

                return (
                  <li key={user.uuid} className="border-b border-divider last:border-b-0">
                    {onSelectUser ? (
                      <button
                        type="button"
                        onClick={() => onSelectUser(user)}
                        disabled={selectionPending}
                        className={`${className} enabled:cursor-pointer disabled:opacity-60`}
                      >
                        {label}
                      </button>
                    ) : (
                      <Link href={`/app/profile/${encodeURIComponent(user.username)}`} className={className}>
                        {label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        Type at least 2 characters to search.
      </p>
    </div>
  );
}
