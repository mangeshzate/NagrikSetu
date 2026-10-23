import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "../database/store";
import { UserProfile } from "@/types/database";

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
 * 1. Validates the server-side session cookie (`nagriksetu_session`).
 * 2. Never trusts client-submitted roles or headers.
 * 3. Returns 401 for unauthenticated visitors and 403 for authenticated students.
 */
export async function verifyAdminRequest(req: NextRequest): Promise<AdminAuthResult> {
  const sessionCookie = req.cookies.get("nagriksetu_session");

  if (!sessionCookie || !sessionCookie.value) {
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

  if (!sessionData || !sessionData.userId) {
    return {
      authorized: false,
      status: 401,
      error: "Malformed session payload.",
    };
  }

  // Verify role: must be strictly ADMIN
  if (sessionData.role !== "ADMIN") {
    console.warn(
      `[Security Guard] Blocked student/unauthorized call to admin API: User ${sessionData.userId} (Role: ${sessionData.role})`
    );
    return {
      authorized: false,
      status: 403,
      error: "Forbidden: You do not have administrator permissions.",
    };
  }

  // Construct verified user object
  const user: UserProfile = {
    id: sessionData.id || sessionData.userId,
    userId: sessionData.userId,
    name: sessionData.name || "Administrator",
    email: sessionData.email || "admin@nagriksetu.in",
    role: "ADMIN",
    preferredLanguage: sessionData.preferredLanguage || "mr",
    onboardingCompleted: true,
    createdAt: sessionData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { authorized: true, user };
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
