// app/app/UserProvider.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { PublicUser } from "@/types/user";

type UserContextValue = {
  user: PublicUser;
  setUser: Dispatch<SetStateAction<PublicUser>>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
  initialUser,
  children,
}: {
  initialUser: PublicUser;
  children: ReactNode;
}) {
  const [user, setUser] = useState(initialUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used inside UserProvider");
  }

  return context;
}