import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "./lib/auth0";

export async function proxy(request: NextRequest) {
  const authResponse = await auth0.middleware(request);

  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    const session = await auth0.getSession(request);

    if (!session) {
      const loginUrl = new URL("/auth/login", request.url);

      loginUrl.searchParams.set(
        "returnTo",
        pathname + request.nextUrl.search
      );

      const screenHint = searchParams.get("screen_hint");

      if (screenHint === "signup") {
        loginUrl.searchParams.set("screen_hint", "signup");
      }

      return NextResponse.redirect(loginUrl);
    }
  }

  return authResponse;
}