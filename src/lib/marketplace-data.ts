import "server-only";
import { createClient } from "./supabase/server";
import { authConfigured } from "./supabase/env";
import { sampleListings, type Corridor, type Country, type Feature, type DocType, type Listing, type Load, type Sector, type Tier, type Truck, type VehicleType, type CargoType, type Packaging } from "./marketplace";

/**
 * Marketplace data access.
 *
 *  - Reads published listings from the database (public columns are open to everyone, including prices).
 *  - Company / contact / address details come from the *_private tables. Row-level security only returns
 *    them to verified accounts, so for everyone else they are simply absent — never hidden in the page.
 *  - If the database is not configured, unreachable or empty, the built-in sample listings are used so the
 *    page never looks broken.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const LOAD_COLS =
  "reference,corridor,origin_city,origin_country,destination_city,destination_country,distance_km,transit_days_min,transit_days_max,borders,commodity_en,commodity_sw,cargo_type,packaging,weight_t,volume_cbm,piece_dimensions,vehicle_type,trucks_needed,pickup_from,pickup_to,deliver_by,pickup_from_offset,pickup_to_offset,deliver_by_offset,posted_hours_ago,created_at,budget_min_usd,budget_max_usd,temp_min_c,temp_max_c,hazmat_class,requirements,documents,note_en,note_sw,urgent,sector,is_sample";
const TRUCK_COLS =
  "reference,vehicle_type,make_model,year,axle_configuration,payload_t,body_spec,location_city,location_country,available_from,available_offset,posted_hours_ago,created_at,corridors,features,rate_min_usd_per_km,rate_max_usd_per_km,is_sample";

const dayMs = 86_400_000;
const offsetOf = (iso: string | null, offset: number | null, base: number) =>
  offset ?? Math.round((Date.parse(`${iso}T00:00:00Z`) - base) / dayMs);
const hoursAgo = (r: Row) => (r.is_sample ? r.posted_hours_ago : Math.max(0, Math.round((Date.now() - Date.parse(r.created_at)) / 3_600_000)));
const one = (x: unknown): Row | null => (Array.isArray(x) ? (x[0] ?? null) : ((x as Row | null) ?? null));
const contact = (p: Row) => ({ name: p.contact_name as string, phone: p.contact_phone as string, email: p.contact_email as string });

function mapLoad(r: Row, base: number): Load {
  const p = one(r.cargo_request_private);
  return {
    kind: "load",
    ref: r.reference,
    corridor: r.corridor as Corridor,
    origin: { city: r.origin_city, cc: r.origin_country as Country },
    destination: { city: r.destination_city, cc: r.destination_country as Country },
    km: r.distance_km,
    transit: [r.transit_days_min, r.transit_days_max],
    borders: r.borders ?? [],
    commodity: { en: r.commodity_en, sw: r.commodity_sw ?? r.commodity_en },
    cargoType: r.cargo_type as CargoType,
    packaging: r.packaging as Packaging,
    weightT: Number(r.weight_t),
    volumeCbm: r.volume_cbm == null ? undefined : Number(r.volume_cbm),
    piece: r.piece_dimensions ?? undefined,
    truckType: r.vehicle_type as VehicleType,
    trucks: r.trucks_needed,
    pickup: [offsetOf(r.pickup_from, r.pickup_from_offset, base), offsetOf(r.pickup_to, r.pickup_to_offset, base)],
    deliveryBy: offsetOf(r.deliver_by, r.deliver_by_offset, base),
    budget: r.budget_min_usd != null && r.budget_max_usd != null ? [r.budget_min_usd, r.budget_max_usd] : null,
    temp: r.temp_min_c != null && r.temp_max_c != null ? [Number(r.temp_min_c), Number(r.temp_max_c)] : undefined,
    hazmat: r.hazmat_class ?? undefined,
    reqs: (r.requirements ?? []) as Feature[],
    docs: (r.documents ?? []) as DocType[],
    note: r.note_en ? { en: r.note_en, sw: r.note_sw ?? r.note_en } : undefined,
    urgent: !!r.urgent,
    postedHoursAgo: hoursAgo(r),
    sector: (r.sector ?? "trading") as Sector,
    isSample: !!r.is_sample,
    priv: p ? { company: p.company_name, contact: contact(p), pickupAddress: p.pickup_address ?? "", deliveryAddress: p.delivery_address ?? "" } : undefined,
  };
}

function mapTruck(r: Row, base: number): Truck {
  const p = one(r.truck_private);
  return {
    kind: "truck",
    ref: r.reference,
    type: r.vehicle_type as VehicleType,
    make: r.make_model,
    year: r.year,
    axles: r.axle_configuration,
    payloadT: Number(r.payload_t),
    body: r.body_spec,
    location: { city: r.location_city, cc: r.location_country as Country },
    availIn: Math.max(0, offsetOf(r.available_from, r.available_offset, base)),
    routes: (r.corridors ?? []) as Corridor[],
    features: (r.features ?? []) as Feature[],
    rate: r.rate_min_usd_per_km != null && r.rate_max_usd_per_km != null ? [Number(r.rate_min_usd_per_km), Number(r.rate_max_usd_per_km)] : null,
    postedHoursAgo: hoursAgo(r),
    isSample: !!r.is_sample,
    priv: p ? { company: p.company_name, contact: contact(p), baseAddress: p.base_address ?? "" } : undefined,
  };
}

const STAFF_ROLES = ["super_admin", "ceo", "operations_manager", "verification_officer", "finance_officer", "marketing_officer", "support_officer"];

async function tierFor(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<{ tier: Tier; role: string | null }> {
  const [profile, owner, members] = await Promise.all([
    supabase.from("profiles").select("role,status").eq("id", userId).maybeSingle(),
    supabase.from("cargo_owners").select("verification_status").eq("profile_id", userId).maybeSingle(),
    supabase.from("company_members").select("transporter_companies(verification_status)").eq("profile_id", userId),
  ]);
  const role: string | null = profile.data?.role ?? null;
  if (profile.data && STAFF_ROLES.includes(profile.data.role) && profile.data.status !== "suspended") return { tier: "verified", role };
  if (owner.data?.verification_status === "verified") return { tier: "verified", role };
  const companies = (members.data ?? []).map((m: Row) => one(m.transporter_companies)).filter(Boolean) as Row[];
  if (companies.some((c) => c.verification_status === "verified")) return { tier: "verified", role };
  return { tier: "registered", role };
}

export async function getMarketplace(): Promise<{ listings: Listing[]; tier: Tier; base: number; role: string | null }> {
  const now = new Date();
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  // Local preview only (never in production): MARKETPLACE_DEV_TIER=registered|verified lets you see each view without an account.
  const dev = process.env.NODE_ENV === "development" ? process.env.MARKETPLACE_DEV_TIER : undefined;
  const devTier: Tier = dev === "verified" || dev === "registered" ? dev : "guest";
  const fallback = { listings: sampleListings(devTier), tier: devTier, base, role: null as string | null };
  if (!authConfigured()) return fallback;

  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const who = auth.user ? await tierFor(supabase, auth.user.id) : { tier: "guest" as Tier, role: null };
    const tier = who.tier;

    const [loads, trucks] = await Promise.all([
      supabase.from("cargo_requests").select(`${LOAD_COLS},cargo_request_private(company_name,contact_name,contact_phone,contact_email,pickup_address,delivery_address)`).eq("status", "published"),
      supabase.from("trucks").select(`${TRUCK_COLS},truck_private(company_name,contact_name,contact_phone,contact_email,base_address)`).eq("status", "published"),
    ]);
    if (loads.error || trucks.error) return fallback;

    const listings: Listing[] = [...(loads.data ?? []).map((r: Row) => mapLoad(r, base)), ...(trucks.data ?? []).map((r: Row) => mapTruck(r, base))];
    if (!listings.length) return { ...fallback, tier: "guest" };
    listings.sort((a, b) => a.postedHoursAgo - b.postedHoursAgo);
    return { listings, tier, base, role: who.role };
  } catch {
    return fallback;
  }
}
