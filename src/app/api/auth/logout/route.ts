import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: "Signed out successfully." });

  if (isSupabaseConfigured()) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch {
                // ignore
              }
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      await supabase.auth.signOut();
    } catch (e) {
      console.warn("[SignOut Error]", e);
    }
  }

  // Clear demo session cookies as well
  response.cookies.set("nagriksetu_session", "", { path: "/", maxAge: 0, expires: new Date(0) });
  response.cookies.set("sb-demo-auth", "", { path: "/", maxAge: 0, expires: new Date(0) });

  return response;
}
