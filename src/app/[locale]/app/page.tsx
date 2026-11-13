import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ResendForm } from "@/components/forms/ResendForm";
import { MyLoads, MyTrucks, type LoadRow, type TruckRow } from "@/components/listings/MyListings";
import { IconCheck, LinkButton, PageHero, Section, StatusChip } from "@/components/ui";
import { logoutAction } from "@/lib/actions/auth";
import { getDict, isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { authConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic"; // always per-user, never cached

type P = { params: Promise<{ locale: string }>; searchParams: Promise<{ welcome?: string; posted?: string; ref?: string; closed?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "app", d.dashboard.title, d.dashboard.limitedNote, { noindex: true });
}

const STAFF = ["super_admin", "ceo", "operations_manager", "verification_officer", "finance_officer", "marketing_officer", "support_officer"];
type StepState = "done" | "next" | "soon";

/**
 * Limited dashboard (SRS §8.4, §33.2, §33.3). Everything is read through the user's own
 * session, so Row-Level Security decides what they can see. Verification chips are rendered
 * strictly from database values – "Verified" can only appear if a human set it (SRS §5.6).
 */
export default async function Workspace({ params, searchParams }: P) {
  const { locale } = await params;
  const { welcome, posted, ref, closed } = await searchParams;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const t = d.dashboard;

  if (!authConfigured()) {
    return (
      <>
        <PageHero title={t.title} />
        <Section><p className="card max-w-xl">{t.notConfigured}</p></Section>
      </>
    );
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(href(locale, "login"));
  const user = auth.user;

  const { data: profile } = await supabase.from("profiles").select("role,status,full_name,email").eq("id", user.id).maybeSingle();
  if (!profile) redirect(href(locale, "login"));

  const isStaff = STAFF.includes(profile.role);

  // Staff created by the Super Admin must replace their temporary password on first sign-in (SRS §5.2).
  if (isStaff) {
    const { data: staff } = await supabase.from("staff_accounts").select("must_change_password").eq("profile_id", user.id).maybeSingle();
    if (staff?.must_change_password) redirect(`${href(locale, "reset")}/update?first=1`);
  }
  type Ver = keyof typeof t.verification;
  let verification = null as Ver | null;
  let company: string | null = null;
  if (profile.role === "transporter") {
    const { data } = await supabase.from("transporter_companies").select("registered_name,verification_status").eq("owner_profile_id", user.id).limit(1).maybeSingle();
    verification = (data?.verification_status as Ver) ?? "unverified";
    company = data?.registered_name ?? null;
  } else if (profile.role === "cargo_owner") {
    const { data } = await supabase.from("cargo_owners").select("business_name,verification_status").eq("profile_id", user.id).maybeSingle();
    verification = (data?.verification_status as Ver) ?? "unverified";
    company = data?.business_name ?? null;
  }

  // The customer's own listings (row-level security returns only their rows).
  let loads: LoadRow[] = [];
  let trucks: TruckRow[] = [];
  if (profile.role === "cargo_owner") {
    const { data } = await supabase
      .from("cargo_requests")
      .select("id,reference,status,origin_city,origin_country,destination_city,destination_country,weight_t,vehicle_type,rejected_reason")
      .eq("owner_profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    loads = (data ?? []) as LoadRow[];
  } else if (profile.role === "transporter") {
    const { data } = await supabase
      .from("trucks")
      .select("id,reference,status,vehicle_type,make_model,year,payload_t,location_city,location_country,rejected_reason,truck_documents(count)")
      .order("created_at", { ascending: false })
      .limit(50);
    trucks = (data ?? []) as unknown as TruckRow[];
  }
  const hasListings = loads.some((l) => l.status !== "closed") || trucks.some((x) => x.status !== "closed");
  const hasDocs = trucks.some((x) => (x.truck_documents?.[0]?.count ?? 0) > 0);

  const contactVerified = profile.status !== "pending_contact_verification";
  const status = profile.status as keyof typeof t.statuses;
  const statusTone = status === "active" ? "dark" : status === "limited" ? "gold" : status === "suspended" ? "danger" : "grey";
  const verTone = verification === "verified" ? "dark" : verification === "under_review" ? "gold" : verification === "rejected" || verification === "expired" ? "danger" : "grey";

  // Steps that exist today are real; the rest honestly say they open in the next release.
  const labels = profile.role === "transporter" ? t.transporterSteps : t.cargoSteps;
  const states: StepState[] = labels.map((_, i) => {
    if (i === 0) return "done";
    if (i === 1) return contactVerified ? "done" : "next";
    if (profile.role === "cargo_owner" && i === 4) return hasListings ? "done" : "next";       // "Submit a cargo request"
    if (profile.role === "transporter" && i === 3) return hasListings ? "done" : "next";       // "Register trucks"
    if (profile.role === "transporter" && i === 4) return hasDocs ? "done" : hasListings ? "next" : "soon"; // "Upload documents"
    return "soon";
  });

  return (
    <>
      <PageHero title={`${t.welcome}${profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`} lead={isStaff ? t.staffText : undefined}>
        {!isStaff && <LinkButton href={href(locale, "marketplace")} variant="gold" className="btn-sm" arrow>{t.browse}</LinkButton>}
        <form action={logoutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="btn btn-outline btn-sm">{t.signOut}</button>
        </form>
      </PageHero>

      <Section>
        {posted === "load" && ref && (
          <div role="status" className="mb-6 flex items-center gap-4 rounded-3xl border border-goldline bg-goldsoft p-5">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-gold"><IconCheck className="h-5 w-5" /></span>
            <p className="font-semibold">{d.listings.my.posted.replace("{ref}", ref)}</p>
          </div>
        )}
        {closed && (
          <div role="status" className="mb-6 rounded-3xl border border-line bg-soft p-4 font-medium">{d.listings.my.closed}</div>
        )}
        {welcome && !isStaff && (
          <div role="status" className="mb-6 flex flex-wrap items-center gap-4 rounded-3xl border border-goldline bg-goldsoft p-5 sm:p-6">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-gold"><IconCheck className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold">
                {t.registeredAs.replace("{role}", t.roles[profile.role as keyof typeof t.roles] ?? profile.role)}
                {company ? ` · ${company}` : ""}
              </p>
              <p className="mt-1 text-muted">{t.registeredText}</p>
            </div>
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="card space-y-5">
            <div>
              <p className="eyebrow">{t.statusLabel}</p>
              <div className="mt-2"><StatusChip tone={statusTone}>{t.statuses[status] ?? status}</StatusChip></div>
            </div>
            <div>
              <p className="eyebrow">{t.role}</p>
              <p className="mt-1 text-lg font-semibold">{t.roles[(isStaff ? "staff" : profile.role) as keyof typeof t.roles] ?? profile.role}</p>
            </div>
            {company && (
              <div>
                <p className="eyebrow">{t.company}</p>
                <p className="mt-1 text-lg font-semibold">{company}</p>
              </div>
            )}
            {verification && (
              <div>
                <p className="eyebrow">{t.verificationLabel}</p>
                <div className="mt-2"><StatusChip tone={verTone}>{t.verification[verification]}</StatusChip></div>
              </div>
            )}
            <p className="rounded-2xl bg-goldsoft p-4 text-[15px] leading-relaxed">
              {!contactVerified ? t.pendingNote : status === "suspended" ? d.auth.errors.suspended : t.limitedNote}
            </p>
            {!contactVerified && profile.email && <ResendForm email={profile.email} locale={locale} d={d} />}
          </div>

          {!isStaff && (
            <div className="card">
              <h2 className="text-2xl font-bold">{t.checklist}</h2>
              <ol className="mt-5 space-y-3">
                {labels.map((label, i) => (
                  <li key={label} className={`flex items-center gap-4 rounded-2xl border p-4 ${states[i] === "next" ? "border-fg bg-goldsoft" : "border-line"}`}>
                    <span className={`grid h-9 w-9 flex-none place-items-center rounded-full text-sm font-bold ${states[i] === "done" ? "bg-gold text-ongold" : states[i] === "next" ? "bg-ink text-gold" : "bg-line text-muted"}`}>
                      {states[i] === "done" ? <IconCheck className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className="flex-1 font-medium">{label}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                      {states[i] === "done" ? t.done : states[i] === "next" ? t.next : t.soon}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {profile.role === "cargo_owner" && <div className="mt-6"><MyLoads locale={locale} d={d} rows={loads} /></div>}
        {profile.role === "transporter" && <div className="mt-6"><MyTrucks locale={locale} d={d} rows={trucks} /></div>}
      </Section>
    </>
  );
}
