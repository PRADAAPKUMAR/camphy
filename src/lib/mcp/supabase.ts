import { createClient } from "@supabase/supabase-js";

// Anonymous read-only Supabase client. All access runs as the `anon` role,
// so RLS decides what the MCP caller can see — never use the service role here.
export function anonSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function asText(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}