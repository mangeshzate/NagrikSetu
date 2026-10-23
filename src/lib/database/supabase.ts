import { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured as checkConfigured } from "../supabase/config";
import { getBrowserSupabaseClient } from "../supabase/client";

/**
 * Checks whether valid Supabase credentials have been configured.
 */
export function isSupabaseConfigured(): boolean {
  return checkConfigured();
}

/**
 * Returns the authoritative Supabase client instance if configured.
 * In production mode, this MUST be available for persistent data operations.
 */
export function getSupabaseClient(): SupabaseClient | null {
  return getBrowserSupabaseClient();
}
