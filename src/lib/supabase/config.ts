/**
 * Supabase Configuration & Environment Utilities
 */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Checks whether valid Supabase credentials have been configured.
 * Rejects placeholder/dummy values.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://your-project.supabase.co" &&
    supabaseAnonKey !== "your-anon-key-here" &&
    !supabaseUrl.includes("your-project") &&
    supabaseUrl.startsWith("http")
  );
}

/**
 * Checks whether the server-side Supabase Service Role key is available.
 */
export function hasServiceRoleKey(): boolean {
  return Boolean(
    isSupabaseConfigured() &&
    supabaseServiceRoleKey &&
    supabaseServiceRoleKey !== "your-service-role-key-here"
  );
}

/**
 * Get canonical application origin URL for OAuth and email redirects.
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}
