import { Suspense } from "react";
import Sidebar from "@/components/sidebar";
import SiteHeader from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/services/getCurrentUser";
import { UserProvider } from "./UserProvider";
import { redirect } from "next/navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-muted" role="status">Loading your app…</div>}>
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
    <UserProvider initialUser={user}>
      <SiteHeader signedIn />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-8 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
