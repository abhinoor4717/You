"use client";

import UserSearchBar from "@/components/UserSearchBar";
import { useUser } from "./UserProvider";

export default function App() {
    const { user } = useUser();

    return (
        <div>
            <UserSearchBar />
        </div>
    )
}
