import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface SessionPayload {
  id: string;
  userId: string;
  role: "STUDENT" | "ADMIN";
  email: string;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected paths
  const isAdminPath = pathname.startsWith("/admin");
  const isProtectedStudentPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/journeys") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/profile");

  if (!isAdminPath && !isProtectedStudentPath) {
    return NextResponse.next();
  }

  // 1. Retrieve session cookie
  const sessionCookie = request.cookies.get("nagriksetu_session");

  if (!sessionCookie || !sessionCookie.value) {
    // If running in development demo mode without cookie, allow landing on demo pages
    // otherwise strictly redirect to login
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (!isDemoMode) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Parse session if present
  let session: SessionPayload | null = null;
  if (sessionCookie?.value) {
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value));
    } catch {
      // Invalid session cookie format
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Admin Route Security Layer (Server-Side Authorization)
  if (isAdminPath) {
    if (!session || session.role !== "ADMIN") {
      // Log server-side security event
      console.warn(
        `[Server Auth Guard] Unauthorized access attempt to ${pathname} by ${session ? `User ${session.id} (Role: ${session.role})` : "Unauthenticated Guest"}`
      );
      const deniedUrl = new URL("/dashboard", request.url);
      deniedUrl.searchParams.set("error", "admin_required");
      return NextResponse.redirect(deniedUrl);
    }
  }

  // 4. Authenticated Student Route Security
  if (isProtectedStudentPath) {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (!session && !isDemoMode) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/journeys/:path*",
    "/onboarding/:path*",
    "/profile/:path*",
  ],
};
