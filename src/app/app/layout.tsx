import { Suspense } from "react";
import Sidebar from "@/components/sidebar";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { UserProvider } from "./UserProvider";
import { redirect } from "next/navigation";

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

  if (user == null) {
    redirect("/onboarding");
    return;
  }

  return (
    <UserProvider initialUser={user!}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="min-w-0 flex-1 p-6 md:p-10">{children}</main>
      </div>
    </UserProvider>
  );
}