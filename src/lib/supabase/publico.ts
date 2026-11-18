import { createClient } from "@supabase/supabase-js";

/** Cliente anónimo, sem cookies: só lê o que é público (blog, escolas, notícias). */
export function supabasePublico() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
