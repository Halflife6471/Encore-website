import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./env";

export const SESSION_ONLY_COOKIE = "enc_so";

/** Session-aware client for Server Components and Server Actions (anon key + user's cookies; RLS applies). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        // "Remember me" unticked → session cookie that ends when the browser closes.
        const sessionOnly = cookieStore.get(SESSION_ONLY_COOKIE)?.value === "1";
        try {
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, sessionOnly ? { ...options, maxAge: undefined, expires: undefined } : options),
          );
        } catch {
          // Called from a Server Component: the proxy refreshes sessions instead.
        }
      },
    },
  });
}
