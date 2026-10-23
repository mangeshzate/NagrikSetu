import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from "./config";

let browserClient: SupabaseClient | null = null;

/**
 * Returns a singleton browser Supabase client for client-side React components.
 * Manages auth cookies in document.cookie automatically via @supabase/ssr.
 */
export function getBrowserSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return browserClient;
}
