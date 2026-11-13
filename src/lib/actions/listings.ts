"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit } from "@/lib/supabase/admin";
import { adminConfigured, authConfigured } from "@/lib/supabase/env";
import { hit } from "@/lib/rate-limit";
import { href } from "@/lib/routes";
import type { Locale } from "@/lib/i18n-config";
import { parseLoadForm, parseTruckForm } from "@/lib/listing-validation";
import type { ActionState } from "./types";

const HOUR = 3_600_000;
const loc = (v: unknown): Locale => (v === "sw" ? "sw" : "en");
const todayUtc = () => new Date().toISOString().slice(0, 10);

/** Postgres "row-level security" / permission failures show up as code 42501. */
const isForbidden = (e: { code?: string } | null) => e?.code === "42501";

async function signedInProfile(locale: Locale) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(href(locale, "login"));
  const { data: profile } = await supabase.from("profiles").select("role,status,full_name,email,phone").eq("id", auth.user.id).maybeSingle();
  return { supabase, user: auth.user, profile };
}

/* ------------------------------------------------------------------ cargo */
export async function postLoadAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const locale = loc(fd.get("locale"));
  if (!authConfigured()) return { error: "unavailable" };
  const { supabase, user, profile } = await signedInProfile(locale);

  if (!profile || profile.role !== "cargo_owner") return { error: "role_cargo" };
  if (!["limited", "active"].includes(profile.status)) return { error: "inactive" };
  if (!hit(`post-load:${user.id}`, 10, HOUR).ok) return { error: "locked" };

  const parsed = parseLoadForm(fd, todayUtc());
  if (!parsed.ok) return { fieldErrors: parsed.errors };
  const d = parsed.data;

  const { data: row, error } = await supabase
    .from("cargo_requests")
    .insert({
      owner_profile_id: user.id,
      status: "pending_review",
      is_sample: false,
      corridor: d.corridor,
      origin_city: d.origin.city,
      origin_country: d.origin.cc,
      destination_city: d.destination.city,
      destination_country: d.destination.cc,
      distance_km: d.km,
      transit_days_min: d.transit[0],
      transit_days_max: d.transit[1],
      borders: d.borders,
      commodity_en: d.commodity,
      cargo_type: d.cargoType,
      packaging: d.packaging,
      weight_t: d.weightT,
      volume_cbm: d.volumeCbm ?? null,
      piece_dimensions: d.piece || null,
      vehicle_type: d.vehicleType,
      trucks_needed: d.trucksNeeded,
      pickup_from: d.pickup[0],
      pickup_to: d.pickup[1],
      deliver_by: d.deliverBy,
      budget_min_usd: d.budget?.[0] ?? null,
      budget_max_usd: d.budget?.[1] ?? null,
      temp_min_c: d.temp?.[0] ?? null,
      temp_max_c: d.temp?.[1] ?? null,
      hazmat_class: d.hazmat ?? null,
      requirements: d.reqs,
      documents: d.docs,
      note_en: d.note || null,
      urgent: d.urgent,
      sector: d.sector,
    })
    .select("id,reference")
    .single();
  if (error || !row) {
    console.error("[post-load] insert failed", { code: error?.code });
    return { error: isForbidden(error) ? "forbidden" : "save_failed" };
  }

  const { error: privErr } = await supabase.from("cargo_request_private").insert({
    cargo_request_id: row.id,
    company_name: d.company,
    contact_name: d.contact.name,
    contact_phone: d.contact.phone,
    contact_email: d.contact.email,
    pickup_address: d.originAddress || null,
    delivery_address: d.destAddress || null,
    declared_value_usd: d.declaredValue ?? null,
    private_notes: d.privateNotes || null,
  });
  if (privErr) {
    // Never leave a listing without contact details: withdraw it and ask the customer to retry.
    console.error("[post-load] private insert failed", { code: privErr.code });
    await supabase.from("cargo_requests").update({ status: "closed" }).eq("id", row.id);
    return { error: "save_failed" };
  }

  if (adminConfigured()) await audit("cargo_request_submitted", { actorId: user.id, entity: "cargo_requests", entityId: row.id, metadata: { reference: row.reference } });
  revalidatePath(`/${locale}`, "layout");
  redirect(`${href(locale, "app")}?posted=load&ref=${encodeURIComponent(row.reference)}`);
}

/* ----------------------------------------------------------------- trucks */
export async function registerTruckAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const locale = loc(fd.get("locale"));
  if (!authConfigured()) return { error: "unavailable" };
  const { supabase, user, profile } = await signedInProfile(locale);

  if (!profile || profile.role !== "transporter") return { error: "role_transporter" };
  if (!["limited", "active"].includes(profile.status)) return { error: "inactive" };
  if (!hit(`register-truck:${user.id}`, 20, HOUR).ok) return { error: "locked" };

  const parsed = parseTruckForm(fd, todayUtc());
  if (!parsed.ok) return { fieldErrors: parsed.errors };
  const d = parsed.data;

  const { data: company } = await supabase.from("transporter_companies").select("id,registered_name").eq("owner_profile_id", user.id).limit(1).maybeSingle();
  if (!company) return { error: "no_company" };

  const { data: row, error } = await supabase
    .from("trucks")
    .insert({
      company_id: company.id,
      status: "pending_review",
      is_sample: false,
      vehicle_type: d.vehicleType,
      make_model: d.makeModel,
      year: d.year,
      axle_configuration: d.axles,
      payload_t: d.payloadT,
      body_spec: d.bodySpec,
      location_city: d.location.city,
      location_country: d.location.cc,
      available_from: d.availableFrom,
      corridors: d.corridors,
      features: d.features,
      rate_min_usd_per_km: d.rate?.[0] ?? null,
      rate_max_usd_per_km: d.rate?.[1] ?? null,
    })
    .select("id,reference")
    .single();
  if (error || !row) {
    console.error("[register-truck] insert failed", { code: error?.code });
    return { error: isForbidden(error) ? "forbidden" : "save_failed" };
  }

  const { error: privErr } = await supabase.from("truck_private").insert({
    truck_id: row.id,
    company_name: company.registered_name,
    contact_name: d.contact.name,
    contact_phone: d.contact.phone,
    contact_email: d.contact.email,
    base_address: d.baseAddress || null,
    plate_number: d.plateNumber,
    trailer_plate: d.trailerPlate || null,
    insurance_expiry: d.insuranceExpiry ?? null,
  });
  if (privErr) {
    console.error("[register-truck] private insert failed", { code: privErr.code });
    await supabase.from("trucks").update({ status: "closed" }).eq("id", row.id);
    return { error: "save_failed" };
  }

  if (adminConfigured()) await audit("truck_submitted", { actorId: user.id, entity: "trucks", entityId: row.id, metadata: { reference: row.reference } });
  revalidatePath(`/${locale}`, "layout");
  // No redirect: the form moves on to the optional "add documents" step with these ids.
  return { ok: true, reference: row.reference, extra: { truckId: row.id, companyId: company.id } };
}

/* ------------------------------------------------------- withdraw a listing */
export async function closeListingAction(fd: FormData): Promise<void> {
  const locale = loc(fd.get("locale"));
  const kind = fd.get("kind") === "truck" ? "truck" : "load";
  const id = String(fd.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id) || !authConfigured()) redirect(href(locale, "app"));

  const { supabase } = await signedInProfile(locale);
  // RLS only lets the owner (or the company's administrators) close their own listing.
  await supabase.from(kind === "truck" ? "trucks" : "cargo_requests").update({ status: "closed" }).eq("id", id);
  revalidatePath(`/${locale}`, "layout");
  redirect(`${href(locale, "app")}?closed=${kind}`);
}
