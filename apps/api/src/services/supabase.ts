import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const effectiveKey = supabaseServiceRoleKey || supabasePublishableKey;

  if (!supabaseUrl || !effectiveKey) {
    return null;
  }

  cachedClient = createClient(supabaseUrl, effectiveKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return cachedClient;
};
