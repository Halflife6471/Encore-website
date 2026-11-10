"use server";

import { headers } from "next/headers";
import { createAdminClient, audit } from "@/lib/supabase/admin";
import { adminConfigured } from "@/lib/supabase/env";
import { countryByCode, toE164 } from "@/lib/countries";
import { clientIp, hit } from "@/lib/rate-limit";
import { flattenErrors, formToObject, leadSchema } from "@/lib/validation";
import type { ActionState } from "./types";

const MIN = 60_000;

/** UTM parameters captured from the page the form was submitted from (SRS §25.2–25.3). */
async function utmFromReferer(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    const ref = (await headers()).get("referer");
    if (!ref) return out;
    const u = new URL(ref);
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"]) {
      const v = u.searchParams.get(k);
      if (v) out[k] = v.slice(0, 80);
    }
  } catch {
    /* ignore malformed referers */
  }
  return out;
}

/**
 * Contact / inquiry / invitation-request forms → marketing_leads (service role, server-side only).
 * No account is created and nothing commercial is exposed (SRD WEB-030, WEB-031).
 */
export async function submitLeadAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const raw = formToObject(fd);
  if (raw.company_website) return { error: "bot", values: raw }; // honeypot

  const ip = await clientIp();
  if (!hit(`lead:${ip}`, 5, 15 * MIN).ok) return { error: "locked", values: raw };

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error), values: raw };
  const v = parsed.data;
  if (!adminConfigured()) return { error: "unavailable", values: raw };

  const c = countryByCode(v.dial);
  const phone = v.phone && c ? toE164(c.dial, v.phone) : null;

  const { data, error } = await createAdminClient()
    .from("marketing_leads")
    .insert({
      lead_type: v.leadType,
      full_name: v.fullName,
      company: v.company || null,
      email: v.email,
      phone,
      country: v.dial,
      business_category: v.category,
      corridor: v.corridor ?? null,
      message: v.message,
      source: "website_form",
      utm: await utmFromReferer(),
      locale: v.locale,
      consent: true,
      updates_opt_in: v.updates === "on",
    })
    .select("reference")
    .single();

  if (error || !data) return { error: "generic", values: raw };
  await audit("lead_created", { entity: "marketing_leads", entityId: data.reference, metadata: { type: v.leadType } });
  return { ok: true, reference: data.reference };
}
