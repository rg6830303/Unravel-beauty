import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-only client, created lazily so builds work without env vars. Never import from client components.
let client: SupabaseClient | null = null;
export const db = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    return (client as any)[prop];
  },
});
