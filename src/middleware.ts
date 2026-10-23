import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dedicated admin login page is public for unauthenticated visitors
  const isAdminLoginPath = pathname === "/admin/login";
  const isAdminApiPath = pathname.startsWith("/api/admin");
  const isAdminPagePath = pathname.startsWith("/admin") && !isAdminLoginPath;
  const isVerifyMobilePath = pathname === "/verify-mobile";
  const isOnboardingPath = pathname.startsWith("/onboarding");
  const isProtectedStudentPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/journeys") ||
    pathname.startsWith("/profile");

  let response = NextResponse.next({ request });
  let user: { id: string; email?: string; phone?: string; phoneConfirmedAt?: string | null } | null = null;
  let userRole: "STUDENT" | "ADMIN" = "STUDENT";
  let isPhoneVerified = false;
  let isOnboardingCompleted = false;

  // 1. Authoritative Supabase Auth Session Verification
  if (isSupabaseConfigured()) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      user = {
        id: authData.user.id,
        email: authData.user.email,
        phone: authData.user.phone,
        phoneConfirmedAt: authData.user.phone_confirmed_at,
      };

      // Query database profile for authoritative role and verification state
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, phone_verified, onboarding_completed, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        userRole = profile.role === "ADMIN" ? "ADMIN" : "STUDENT";
        isPhoneVerified = Boolean(profile.phone_verified || authData.user.phone_confirmed_at);
        isOnboardingCompleted = Boolean(profile.onboarding_completed);
      } else {
        // Fallback for new user session
        userRole = "STUDENT";
        isPhoneVerified = Boolean(authData.user.phone_confirmed_at);
        isOnboardingCompleted = false;
      }
    }
  } else {
    // 2. Demo / Test Fallback (Strictly when NEXT_PUBLIC_DEMO_MODE=true or in test env)
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NODE_ENV === "test";
    if (isDemoMode) {
      const sessionCookie = request.cookies.get("nagriksetu_session") || request.cookies.get("sb-demo-auth");
      if (sessionCookie?.value) {
        try {
          const session = JSON.parse(decodeURIComponent(sessionCookie.value));
          if (session?.userId || session?.id) {
            user = {
              id: session.userId || session.id,
              email: session.email,
              phone: session.phone || "+919820012345",
              phoneConfirmedAt: session.phoneVerified === false ? null : "2026-01-01T00:00:00Z",
            };
            userRole = (session.id === "user_demo_admin" || session.userId === "user_demo_admin" || session.role === "ADMIN") ? "ADMIN" : "STUDENT";
            isPhoneVerified = session.phoneVerified === false ? false : Boolean(session.phoneVerified ?? true);
            isOnboardingCompleted = session.onboardingCompleted ?? true;
          }
        } catch {
          // invalid cookie format
        }
      }
    }
  }

  // 3. Admin API Security Guard (Strict 401 / 403 JSON)
  if (isAdminApiPath) {
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Administrator session missing." },
        { status: 401 }
      );
    }
    if (userRole !== "ADMIN") {
      console.warn(
        `[Edge Auth Guard] Blocked student/unauthorized API access to ${pathname} by User ${user.id} (Role: ${userRole})`
      );
      return NextResponse.json(
        { error: "Forbidden: You do not have administrator permissions." },
        { status: 403 }
      );
    }
    return response;
  }

  // 4. Admin Page Security (Redirect unauthenticated to /admin/login, student to error)
  if (isAdminPagePath) {
    if (!user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "ADMIN") {
      console.warn(
        `[Server Auth Guard] Student ${user.id} denied access to admin page ${pathname}`
      );
      const deniedUrl = new URL("/admin/login", request.url);
      deniedUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(deniedUrl);
    }
    return response;
  }

  // If authenticated admin visits /admin/login, redirect to /admin
  if (isAdminLoginPath && user && userRole === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // 5. Verify Mobile Page Guard
  if (isVerifyMobilePath) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", "/verify-mobile");
      return NextResponse.redirect(loginUrl);
    }
    // If user's mobile is ALREADY verified, no need to be on /verify-mobile
    if (isPhoneVerified) {
      if (!isOnboardingCompleted) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // 6. Onboarding Page Guard
  if (isOnboardingPath) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", "/onboarding");
      return NextResponse.redirect(loginUrl);
    }
    // Student must have verified mobile number before completing onboarding
    if (userRole === "STUDENT" && !isPhoneVerified) {
      return NextResponse.redirect(new URL("/verify-mobile", request.url));
    }
    return response;
  }

  // 7. Protected Student Routes (/dashboard, /journeys, /profile)
  if (isProtectedStudentPath) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole === "STUDENT") {
      // Missing verified mobile? Force to /verify-mobile
      if (!isPhoneVerified) {
        return NextResponse.redirect(new URL("/verify-mobile", request.url));
      }
      // Onboarding incomplete? Redirect to /onboarding
      if (!isOnboardingCompleted && !pathname.startsWith("/onboarding")) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/dashboard/:path*",
    "/journeys/:path*",
    "/onboarding/:path*",
    "/profile/:path*",
    "/verify-mobile",
  ],
};
