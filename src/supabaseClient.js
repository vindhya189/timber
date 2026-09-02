import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  console.error(
    "❌ VITE_SUPABASE_URL missing in .env.local"
  );
}

if (!supabasePublishableKey) {
  console.error(
    "❌ VITE_SUPABASE_PUBLISHABLE_KEY missing in .env.local"
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "timbermart-auth",
    },
  }
);