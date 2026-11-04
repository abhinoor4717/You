import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "./lib/auth0";

export async function proxy(request: NextRequest) {
  const authResponse = await auth0.middleware(request);

  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    const session = await auth0.getSession(request);

    // Check for auth0 session
    const loginUrl = new URL("/auth/login", request.url);
    if (!session) {
      loginUrl.searchParams.set("returnTo", pathname + request.nextUrl.search);

      const screenHint = searchParams.get("screen_hint");

      if (screenHint === "signup") {
        loginUrl.searchParams.set("screen_hint", "signup");
      }

      return NextResponse.redirect(loginUrl);
    }

    // Check if user exists in internal DB (needs onboarding?)

    // try {
    //   const url = new URL(`/api/users/exists?email=${encodeURIComponent(session.user.email!)}`, request.url);

    //   const res = await fetch(url);
    //   const data = await res.json();

    //   if (!res.ok) {
    //     throw new Error(data.error || "Failed to fetch users");
    //   }

    //   if (!data.result) return NextResponse.redirect(new URL("/app/onboarding"));
    // } catch (error) {
    //   console.log("Error while checking if user is onboarded: ", error);
    //   return NextResponse.redirect("/");
    // }
  }

  return authResponse;
}
