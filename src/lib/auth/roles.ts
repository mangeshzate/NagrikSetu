import { UserRole, UserProfile } from "@/types/database";
import { getAdminSupabaseClient } from "../supabase/admin";
import { createServerSupabaseClient } from "../supabase/server";
import { isSupabaseConfigured } from "../supabase/config";
import { DEMO_ADMIN_USER, DEMO_STUDENT_USER } from "../database/mockData";

export interface TrustedAuthProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  preferredLanguage: "en" | "mr";
  onboardingCompleted: boolean;
  phone?: string;
  phoneVerified: boolean;
}

/**
 * Server-Side Authoritative Role & Profile Lookup
 * Strictly queries the trusted database (never client-submitted roles or query params).
 */
export async function getTrustedUserProfile(userId: string): Promise<TrustedAuthProfile | null> {
  if (!userId) return null;

  // 1. Supabase Authoritative Lookup
  if (isSupabaseConfigured()) {
    const adminClient = getAdminSupabaseClient();
    const serverClient = await createServerSupabaseClient();
    const clientToUse = adminClient || serverClient;

    if (clientToUse) {
      try {
        const { data, error } = await clientToUse
          .from("profiles")
          .select("id, user_id, name, email, role, preferred_language, onboarding_completed, phone, phone_verified")
          .eq("user_id", userId)
          .maybeSingle();

        if (data) {
          return {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            email: data.email,
            role: data.role === "ADMIN" ? "ADMIN" : "STUDENT",
            preferredLanguage: (data.preferred_language as "en" | "mr") || "mr",
            onboardingCompleted: Boolean(data.onboarding_completed),
            phone: data.phone || undefined,
            phoneVerified: Boolean(data.phone_verified),
          };
        }

        // Profile does not exist yet (e.g. brand new Google OAuth or OTP sign-in)
        // If admin client is available, inspect auth.users and provision a secure initial STUDENT profile
        if (adminClient) {
          const { data: authUserData } = await adminClient.auth.admin.getUserById(userId);
          const authUser = authUserData?.user;
          if (authUser) {
            const isPhoneConfirmed = Boolean(authUser.phone && authUser.phone_confirmed_at);
            const userEmail = authUser.email || "";
            const userName =
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              (userEmail ? userEmail.split("@")[0].toUpperCase() : "Student");

            const { data: newProfile, error: insertErr } = await adminClient
              .from("profiles")
              .insert({
                user_id: userId,
                name: userName,
                email: userEmail,
                role: "STUDENT", // Crucial: New signups are ALWAYS students. Only existing DB rows can be ADMIN.
                preferred_language: "mr",
                onboarding_completed: false,
                phone: authUser.phone || null,
                phone_verified: isPhoneConfirmed,
              })
              .select()
              .single();

            if (newProfile) {
              return {
                id: newProfile.id,
                userId: newProfile.user_id,
                name: newProfile.name,
                email: newProfile.email,
                role: "STUDENT",
                preferredLanguage: "mr",
                onboardingCompleted: false,
                phone: newProfile.phone || undefined,
                phoneVerified: isPhoneConfirmed,
              };
            }
          }
        }
      } catch (err) {
        console.error("[Auth Roles] Error querying trusted user profile:", err);
      }
    }
  }

  // 2. Demo / Test Fallback (Only active when NEXT_PUBLIC_DEMO_MODE is true or during unit testing)
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NODE_ENV === "test";
  if (isDemoMode) {
    if (userId === DEMO_ADMIN_USER.id || userId === DEMO_ADMIN_USER.userId) {
      return {
        id: DEMO_ADMIN_USER.id,
        userId: DEMO_ADMIN_USER.userId,
        name: DEMO_ADMIN_USER.name,
        email: DEMO_ADMIN_USER.email,
        role: "ADMIN",
        preferredLanguage: "mr",
        onboardingCompleted: true,
        phone: "+919876543210",
        phoneVerified: true,
      };
    }

    if (userId === DEMO_STUDENT_USER.id || userId === DEMO_STUDENT_USER.userId) {
      return {
        id: DEMO_STUDENT_USER.id,
        userId: DEMO_STUDENT_USER.userId,
        name: DEMO_STUDENT_USER.name,
        email: DEMO_STUDENT_USER.email,
        role: "STUDENT",
        preferredLanguage: "mr",
        onboardingCompleted: DEMO_STUDENT_USER.onboardingCompleted,
        phone: "+919820012345",
        phoneVerified: true,
      };
    }
  }

  return null;
}

/**
 * Server-Side Administrator Verification
 * Strict zero-trust validation: returns true ONLY if the database confirms role === 'ADMIN'.
 */
export async function isServerAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  const profile = await getTrustedUserProfile(userId);
  return profile?.role === "ADMIN";
}
