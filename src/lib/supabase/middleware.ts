import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "./config";

export interface MiddlewareClientResult {
  supabase: ReturnType<typeof createServerClient> | null;
  response: NextResponse;
}

/**
 * Creates a Supabase client tailored for Next.js Edge Middleware.
 * Refreshes auth tokens and synchronizes cookies across request and response.
 */
export function createMiddlewareSupabaseClient(
  request: NextRequest,
  response: NextResponse = NextResponse.next({ request })
): MiddlewareClientResult {
  if (!isSupabaseConfigured()) {
    return { supabase: null, response };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  return { supabase, response };
}
