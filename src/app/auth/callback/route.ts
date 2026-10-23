import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "@/lib/supabase/config";
import { getTrustedUserProfile } from "@/lib/auth/roles";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=missing_auth_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Can be ignored if handled in middleware
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data?.user) {
    console.error("[Auth Callback Error]", error);
    return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed`);
  }

  const user = data.user;
  const profile = await getTrustedUserProfile(user.id);

  // If Admin: redirect to Admin Portal
  if (profile?.role === "ADMIN") {
    return NextResponse.redirect(`${origin}/admin`);
  }

  // If Student: check mandatory verified mobile requirement
  const isPhoneVerified = Boolean(user.phone && user.phone_confirmed_at) || Boolean(profile?.phoneVerified);
  if (!isPhoneVerified) {
    return NextResponse.redirect(`${origin}/verify-mobile`);
  }

  // If onboarding incomplete: redirect to Onboarding
  if (!profile?.onboardingCompleted) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  // Custom next parameter or Dashboard
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
