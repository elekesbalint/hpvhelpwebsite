import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let publicClient: ReturnType<typeof createClient<Database>> | null = null;

/** Server-side anon Supabase client for public catalog reads (sitemap, metadata). */
export function createPublicSupabase() {
  if (publicClient) return publicClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase envs for public server client.");
  }

  publicClient = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return publicClient;
}
