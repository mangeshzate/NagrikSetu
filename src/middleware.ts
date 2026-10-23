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
  const isAdminApiPath = pathname.startsWith("/api/admin");
  const isAdminPagePath = pathname.startsWith("/admin");
  const isProtectedStudentPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/journeys") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/profile");

  if (!isAdminApiPath && !isAdminPagePath && !isProtectedStudentPath) {
    return NextResponse.next();
  }

  // 1. Retrieve session cookie
  const sessionCookie = request.cookies.get("nagriksetu_session");

  // 2. Parse session if present
  let session: SessionPayload | null = null;
  if (sessionCookie?.value) {
    try {
      session = JSON.parse(decodeURIComponent(sessionCookie.value));
    } catch {
      if (isAdminApiPath) {
        return NextResponse.json(
          { error: "Invalid session format. Please log in again." },
          { status: 401 }
        );
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Admin API Security Guard (Returns 401 / 403 JSON)
  if (isAdminApiPath) {
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required. Administrator session missing." },
        { status: 401 }
      );
    }
    if (session.role !== "ADMIN") {
      console.warn(
        `[Edge Auth Guard] Blocked unauthorized API access to ${pathname} by User ${session.id} (Role: ${session.role})`
      );
      return NextResponse.json(
        { error: "Forbidden: You do not have administrator permissions." },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // 4. Admin Page Route Security Layer (Server-Side Authorization & Redirect)
  if (isAdminPagePath) {
    if (!session || session.role !== "ADMIN") {
      console.warn(
        `[Server Auth Guard] Unauthorized access attempt to ${pathname} by ${session ? `User ${session.id} (Role: ${session.role})` : "Unauthenticated Guest"}`
      );
      const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
      if (!session && !isDemoMode) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      const deniedUrl = new URL("/dashboard", request.url);
      deniedUrl.searchParams.set("error", "admin_required");
      return NextResponse.redirect(deniedUrl);
    }
  }

  // 5. Authenticated Student Route Security
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
    "/api/admin/:path*",
    "/dashboard/:path*",
    "/journeys/:path*",
    "/onboarding/:path*",
    "/profile/:path*",
  ],
};
