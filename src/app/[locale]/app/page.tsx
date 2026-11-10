import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ResendForm } from "@/components/forms/ResendForm";
import { IconCheck, PageHero, Section, StatusChip } from "@/components/ui";
import { logoutAction } from "@/lib/actions/auth";
import { getDict, isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { authConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic"; // always per-user, never cached

type P = { params: Promise<{ locale: string }> };
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
export default async function Workspace({ params }: P) {
  const { locale } = await params;
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

  const contactVerified = profile.status !== "pending_contact_verification";
  const status = profile.status as keyof typeof t.statuses;
  const statusTone = status === "active" ? "dark" : status === "limited" ? "gold" : status === "suspended" ? "danger" : "grey";
  const verTone = verification === "verified" ? "dark" : verification === "under_review" ? "gold" : verification === "rejected" || verification === "expired" ? "danger" : "grey";

  // Steps that exist today are real; the rest honestly say they open in the next release.
  const labels = profile.role === "transporter" ? t.transporterSteps : t.cargoSteps;
  const states: StepState[] = labels.map((_, i) => (i === 0 ? "done" : i === 1 ? (contactVerified ? "done" : "next") : "soon"));

  return (
    <>
      <PageHero title={`${t.welcome}${profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`} lead={isStaff ? t.staffText : undefined}>
        <form action={logoutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="btn btn-outline btn-sm">{t.signOut}</button>
        </form>
      </PageHero>

      <Section>
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
            <p className="rounded-2xl bg-goldtint p-4 text-[15px] leading-relaxed">
              {!contactVerified ? t.pendingNote : status === "suspended" ? d.auth.errors.suspended : t.limitedNote}
            </p>
            {!contactVerified && profile.email && <ResendForm email={profile.email} locale={locale} d={d} />}
          </div>

          {!isStaff && (
            <div className="card">
              <h2 className="text-2xl font-bold">{t.checklist}</h2>
              <ol className="mt-5 space-y-3">
                {labels.map((label, i) => (
                  <li key={label} className={`flex items-center gap-4 rounded-2xl border p-4 ${states[i] === "next" ? "border-char bg-goldtint" : "border-g1"}`}>
                    <span className={`grid h-9 w-9 flex-none place-items-center rounded-full text-sm font-bold ${states[i] === "done" ? "bg-gold text-char" : states[i] === "next" ? "bg-char text-gold" : "bg-g1 text-g3"}`}>
                      {states[i] === "done" ? <IconCheck className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className="flex-1 font-medium">{label}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-g3">
                      {states[i] === "done" ? t.done : states[i] === "next" ? t.next : t.soon}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
