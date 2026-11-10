import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/**
 * Service-role client. BYPASSES RLS – server-only, never imported by client code
 * (SRS §30.3: "Service-role credentials shall never be exposed to the browser").
 */
export function createAdminClient() {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function audit(
  action: string,
  data: { actorId?: string | null; entity?: string; entityId?: string; metadata?: Record<string, unknown> } = {},
) {
  try {
    const db = createAdminClient();
    await db.from("audit_logs").insert({
      actor_id: data.actorId ?? null,
      action,
      entity: data.entity ?? null,
      entity_id: data.entityId ?? null,
      metadata: data.metadata ?? {},
    });
  } catch {
    // Audit failures must never break the user flow, but should be monitored.
    console.error("[audit] failed to record", action);
  }
}
