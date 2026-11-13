import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FormHero } from "@/components/listings/FormHero";
import { RegisterTruckForm } from "@/components/listings/RegisterTruckForm";
import { Section } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { authConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "app", d.listings.truck.title, d.listings.truck.lead, { noindex: true });
}

export default async function RegisterTruck({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  if (!authConfigured()) redirect(href(locale, "login"));

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(href(locale, "login"));
  const { data: profile } = await supabase.from("profiles").select("role,status,full_name,email,phone").eq("id", auth.user.id).maybeSingle();
  if (!profile || profile.role !== "transporter") redirect(href(locale, "app"));
  const { data: company } = await supabase.from("transporter_companies").select("registered_name").eq("owner_profile_id", auth.user.id).limit(1).maybeSingle();

  return (
    <>
      <FormHero title={d.listings.truck.title} lead={d.listings.truck.lead} back={d.listings.my.backToAccount} backHref={href(locale, "app")} />
      <Section className="!py-8 sm:!py-12">
        <RegisterTruckForm
          locale={locale}
          d={d}
          defaults={{
            company: company?.registered_name ?? "",
            contactName: profile.full_name ?? "",
            phone: profile.phone ?? "",
            email: profile.email ?? auth.user.email ?? "",
            today: new Date().toISOString().slice(0, 10),
          }}
        />
      </Section>
    </>
  );
}
