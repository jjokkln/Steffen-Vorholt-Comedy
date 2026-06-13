import { createBrowserClient } from "@supabase/ssr";

/** Browser-Client mit Admin-Session aus den Cookies (erfüllt Storage-RLS "authenticated"). */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
