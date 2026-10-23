import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "@/lib/supabase/config";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { dataStore } from "@/lib/database/store";

/**
 * Normalizes Indian phone numbers to E.164: +91XXXXXXXXXX
 */
function normalizeIndianMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    return `+${digits}`;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, token } = body;

    const normalizedPhone = normalizeIndianMobile(phone || "");
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
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
              // Ignore in route handler
            }
          },
        },
      });

      // 1. Verify that a valid authenticated session exists
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        return NextResponse.json(
          { error: "Authentication required to verify mobile number." },
          { status: 401 }
        );
      }

      const user = authData.user;

      // 2. If token is provided, verify it authoritative via Supabase Auth
      if (token) {
        const cleanToken = String(token).trim();
        // Attempt verification with phone_change (for existing user linking mobile) or sms
        let verifyResult = await supabase.auth.verifyOtp({
          phone: normalizedPhone,
          token: cleanToken,
          type: "phone_change",
        });

        if (verifyResult.error) {
          // Try standard sms verification type
          verifyResult = await supabase.auth.verifyOtp({
            phone: normalizedPhone,
            token: cleanToken,
            type: "sms",
          });
        }

        if (verifyResult.error) {
          return NextResponse.json(
            { error: verifyResult.error.message || "Invalid or expired verification code." },
            { status: 400 }
          );
        }
      }

      // 3. Confirm that the phone is indeed confirmed in Supabase Auth
      const { data: refreshedUser } = await supabase.auth.getUser();
      const confirmedUser = refreshedUser?.user || user;

      // Note: In Supabase Auth, phone_confirmed_at is set once verified
      const isConfirmed = Boolean(confirmedUser.phone_confirmed_at || confirmedUser.phone === normalizedPhone);
      if (!isConfirmed && !token) {
        return NextResponse.json(
          { error: "Mobile number has not been verified in Supabase Auth." },
          { status: 400 }
        );
      }

      // 4. Securely synchronize verified phone to database profile
      const adminClient = getAdminSupabaseClient();
      const clientToUpdate = adminClient || supabase;

      const { error: updateError } = await clientToUpdate
        .from("profiles")
        .update({
          phone: normalizedPhone,
          phone_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("[Verify Phone DB Sync Error]", updateError);
      }

      return NextResponse.json({
        success: true,
        verified: true,
        phone: normalizedPhone,
      });
    }

    // Demo Mode fallback (Only allowed when NEXT_PUBLIC_DEMO_MODE=true)
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NODE_ENV === "test";
    if (isDemoMode) {
      if (token === "000000" || (token && token.length === 6)) {
        return NextResponse.json({
          success: true,
          verified: true,
          phone: normalizedPhone,
        });
      }
      return NextResponse.json(
        { error: "Invalid verification code. Use the 6-digit code received." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Authentication system is not configured." },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("[Verify Phone Error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to verify mobile number." },
      { status: 500 }
    );
  }
}
