"use client";

import { useEffect, useState } from "react";
import type { User } from "@/types/user";
import { useUser } from "@auth0/nextjs-auth0";
import { useRouter } from "next/navigation";

export default function App() {
    const router = useRouter();
    const { user, isLoading } = useUser();
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log("Auth0 loading:", isLoading);
        console.log("Auth0 user:", user);

        if (isLoading || !user?.email) return;

        async function fetchUsers() {
            setLoadingUsers(true);
            setError(null);

            try {
                const url =
                    `/api/users?email=${encodeURIComponent(user!.email!)}`;

                console.log("Fetching:", url);

                const res = await fetch(url);
                const data = await res.json();

                console.log("API status:", res.status);
                console.log("API response:", data);

                if (!res.ok) {
                    throw new Error(data.error || "Failed to fetch users");
                }

                setUsers(data.result ?? []);

                if (users.length == 0) router.replace("/app/onboarding");
            } catch (err) {
                console.error("Fetch error:", err);
                setError(
                    err instanceof Error ? err.message : "Unknown error"
                );
            } finally {
                setLoadingUsers(false);
            }
        }

        fetchUsers();
    }, [user?.email, isLoading]);

    if (isLoading) return <p>Loading authentication...</p>;
    if (!user) return <p>Please log in.</p>;
    if (loadingUsers) return <p>Loading users...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h1>Users</h1>
            {users.length === 0 ? (
                <p>No users found.</p>
            ) : (
                <ul>
                    {users.map((u) => (
                        <li key={u.uuid}>
                            {u.username} — {u.email}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
