import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "@/lib/supabase/config";
import { getTrustedUserProfile } from "@/lib/auth/roles";
import { DEMO_STUDENT_USER, DEMO_ADMIN_USER } from "@/lib/database/mockData";

export async function GET(req: NextRequest) {
  if (isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    const { data: authData, error } = await supabase.auth.getUser();
    if (error || !authData?.user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const authUser = authData.user;
    const trustedProfile = await getTrustedUserProfile(authUser.id);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: trustedProfile?.id || authUser.id,
        userId: authUser.id,
        name: trustedProfile?.name || authUser.email?.split("@")[0] || "Student",
        email: trustedProfile?.email || authUser.email || "",
        role: trustedProfile?.role || "STUDENT",
        preferredLanguage: trustedProfile?.preferredLanguage || "mr",
        onboardingCompleted: Boolean(trustedProfile?.onboardingCompleted),
        phone: trustedProfile?.phone || authUser.phone || null,
        phoneVerified: Boolean(trustedProfile?.phoneVerified || authUser.phone_confirmed_at),
      },
    });
  }

  // Demo fallback
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NODE_ENV === "test";
  if (isDemoMode) {
    const sessionCookie = req.cookies.get("nagriksetu_session");
    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(decodeURIComponent(sessionCookie.value));
        const trusted = await getTrustedUserProfile(session.userId || session.id);
        if (trusted) {
          return NextResponse.json({
            authenticated: true,
            user: trusted,
          });
        }
      } catch {
        // invalid
      }
    }
  }

  return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
}
