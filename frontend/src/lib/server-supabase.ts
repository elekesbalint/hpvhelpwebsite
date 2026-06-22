import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrlEnv || !supabaseAnonKeyEnv) {
  throw new Error("Missing Supabase envs for server client.");
}
const supabaseUrl = supabaseUrlEnv;
const supabaseAnonKey = supabaseAnonKeyEnv;

export function createServerSupabaseWithBearer(accessToken: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function createServiceSupabase() {
  if (!serviceRoleKey) return null;
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
