export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/** Auth features need the public URL + anon key. */
export function authConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}

/** Leads, phone login and audit logging also need the server-only service key. */
export function adminConfigured(): boolean {
  return authConfigured() && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}
