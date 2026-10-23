import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseServiceRoleKey, hasServiceRoleKey } from "./config";

let adminClientInstance: SupabaseClient | null = null;

/**
 * Returns a privileged Supabase client powered by the service-role key.
 * Strictly for server-side trusted operations (e.g., verifying user roles,
 * checking admin permissions, managing profiles). Never expose to the client.
 */
export function getAdminSupabaseClient(): SupabaseClient | null {
  if (!hasServiceRoleKey()) {
    return null;
  }

  if (!adminClientInstance) {
    adminClientInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClientInstance;
}
