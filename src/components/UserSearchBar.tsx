"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PublicUser } from "@/types/user";

export default function UserSearchBar() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resultsId = useId();
  const showResults = query.trim().length >= 2;

  useEffect(() => {
    const searchTerm = query.trim();

    if (searchTerm.length < 2) {
      setUsers([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchTerm)}`,
          { signal: controller.signal }
        );

        if (!response.ok) throw new Error("Search failed");

        const data: {users: PublicUser[]} = await response.json();
        setUsers(data.users);
      } catch {
        if (!controller.signal.aborted) {
          setUsers([]);
          setError("Could not load users. Try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  return (
    <section className="mx-auto max-w-3xl p-6 md:p-10">
      <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-violet-700">
        Player finder
      </p>
      <h1 className="mb-6 text-3xl font-black text-[#262044]">
        Find your people
      </h1>

      <div className="relative">
        <div className="flex items-center gap-3 border-4 border-[#262044] bg-white p-2 shadow-[6px_6px_0_#a78bfa] focus-within:shadow-[6px_6px_0_#22d3ee]">
          <span className="grid size-11 shrink-0 place-items-center border-2 border-[#262044] bg-violet-200 text-violet-800">
            <Search size={20} aria-hidden="true" />
          </span>

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or username..."
            aria-label="Search users"
            aria-autocomplete="list"
            aria-expanded={showResults}
            aria-controls={resultsId}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-2 py-3 font-mono text-sm text-[#262044] outline-none placeholder:text-violet-400"
          />
        </div>

        {showResults && (
          <div
            id={resultsId}
            className="absolute z-10 mt-3 w-full border-4 border-[#262044] bg-white shadow-[6px_6px_0_#a78bfa]"
            role="region"
            aria-label="Search results"
          >
            {loading ? (
              <p className="p-4 font-mono text-sm text-violet-700" role="status">
                Searching players…
              </p>
            ) : error ? (
              <p className="p-4 font-mono text-sm text-pink-700" role="alert">
                {error}
              </p>
            ) : users.length === 0 ? (
              <p className="p-4 font-mono text-sm text-violet-700">
                No players found.
              </p>
            ) : (
              <ul>
                {users.map((user) => (
                  <li key={user.uuid}>
                    <Link
                      href={`/app/profile/${encodeURIComponent(user.username)}`}
                      className="block border-b-2 border-violet-100 px-4 py-3 font-mono hover:bg-cyan-100"
                    >
                      <span className="block font-bold text-[#262044]">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="text-sm text-violet-700">
                        @{user.username}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 font-mono text-xs text-violet-700">
        Type at least 2 characters to search.
      </p>
    </section>
  );
}