import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { UserProfile } from "@/types/database";
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "../supabase/config";
import { getTrustedUserProfile, isServerAdmin } from "./roles";

export interface AdminAuthResult {
  authorized: boolean;
  user?: UserProfile;
  status?: number;
  error?: string;
}

/**
 * Server-Side Admin Authorization Guard
 * Strictly verifies that the incoming request is from an authenticated Administrator.
 *
 * Multi-layer security:
 * 1. Validates the cryptographically signed Supabase Auth session / token.
 * 2. Performs a server-side database lookup to verify the trusted ADMIN role.
 * 3. Never trusts client-submitted roles, headers, query parameters, or localStorage.
 * 4. Returns 401 for unauthenticated visitors and 403 for authenticated students.
 */
export async function verifyAdminRequest(req: NextRequest): Promise<AdminAuthResult> {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NODE_ENV === "test";

  // 1. Authoritative Supabase Auth Verification
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll() {
            // Read-only in guard
          },
        },
      });

      // Also check Authorization header if present
      const authHeader = req.headers.get("authorization");
      let authUser = null;

      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          authUser = data.user;
        }
      }

      if (!authUser) {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          authUser = data.user;
        }
      }

      if (authUser) {
        // Authenticated user found in Supabase Auth.
        // Now perform a strict server-side database role lookup!
        const trustedProfile = await getTrustedUserProfile(authUser.id);

        if (!trustedProfile || trustedProfile.role !== "ADMIN") {
          console.warn(
            `[Security Guard] Blocked student/unauthorized call to admin API: User ${authUser.id} (Role: ${trustedProfile?.role || "UNKNOWN"})`
          );
          return {
            authorized: false,
            status: 403,
            error: "Forbidden: You do not have administrator permissions.",
          };
        }

        const user: UserProfile = {
          id: trustedProfile.id,
          userId: trustedProfile.userId,
          name: trustedProfile.name,
          email: trustedProfile.email,
          role: "ADMIN",
          preferredLanguage: trustedProfile.preferredLanguage,
          onboardingCompleted: true,
          phone: trustedProfile.phone,
          phoneVerified: trustedProfile.phoneVerified,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return { authorized: true, user };
      }
    } catch (err) {
      console.error("[AdminGuard] Supabase auth verification error:", err);
    }
  }

  // 2. Demo & Unit Test Fallback (Strictly guarded by NEXT_PUBLIC_DEMO_MODE / test environment)
  if (isDemoMode) {
    // Check session cookie for demo mode / testing
    const sessionCookie = req.cookies.get("nagriksetu_session") || req.cookies.get("sb-demo-auth");
    if (!sessionCookie?.value) {
      return {
        authorized: false,
        status: 401,
        error: "Authentication required. Please log in as an administrator.",
      };
    }

    let sessionData: any = null;
    try {
      sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
    } catch {
      return {
        authorized: false,
        status: 401,
        error: "Invalid session format. Please log in again.",
      };
    }

    const userId = sessionData?.userId || sessionData?.id;
    if (!userId) {
      return {
        authorized: false,
        status: 401,
        error: "Malformed session payload.",
      };
    }

    // Zero-Trust: Query the trusted role for this userId instead of trusting sessionData.role!
    const trustedProfile = await getTrustedUserProfile(userId);
    if (!trustedProfile || trustedProfile.role !== "ADMIN") {
      console.warn(
        `[Security Guard] Blocked student/unauthorized call to admin API: User ${userId} (Role: ${trustedProfile?.role || sessionData.role || "UNKNOWN"})`
      );
      return {
        authorized: false,
        status: 403,
        error: "Forbidden: You do not have administrator permissions.",
      };
    }

    const user: UserProfile = {
      id: trustedProfile.id,
      userId: trustedProfile.userId,
      name: trustedProfile.name,
      email: trustedProfile.email,
      role: "ADMIN",
      preferredLanguage: trustedProfile.preferredLanguage,
      onboardingCompleted: true,
      phone: trustedProfile.phone,
      phoneVerified: trustedProfile.phoneVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { authorized: true, user };
  }

  // 3. In production mode with unconfigured or invalid session: Strictly 401
  return {
    authorized: false,
    status: 401,
    error: "Authentication required. Please log in as an administrator.",
  };
}

/**
 * Helper to produce standard JSON responses for unauthorized admin calls
 */
export function unauthorizedAdminResponse(result: AdminAuthResult) {
  return NextResponse.json(
    { error: result.error || "Unauthorized" },
    { status: result.status || 401 }
  );
}
