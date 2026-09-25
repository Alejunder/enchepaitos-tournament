import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getSupabaseEnv, getSupabaseServiceRoleKey } from "./env";

export function createAdminClient() {
  const { url } = getSupabaseEnv();

  return createClient<Database>(url, getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
