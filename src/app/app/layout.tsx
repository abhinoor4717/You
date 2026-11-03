// src/app/app/layout.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { UserProvider } from "./UserProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="p-8">Loading your app…</div>}>
      <AuthenticatedApp>{children}</AuthenticatedApp>
    </Suspense>
  );
}

async function AuthenticatedApp({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login"); // Change this if your login route differs.
  }

  return (
    <UserProvider initialUser={user}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="min-w-0 flex-1 p-6 md:p-10">{children}</main>
      </div>
    </UserProvider>
  );
}