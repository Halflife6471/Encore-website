import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FormHero } from "@/components/listings/FormHero";
import { TruckDocuments, type TruckDoc } from "@/components/listings/TruckDocuments";
import { Section, StatusChip } from "@/components/ui";
import { recommendedTruckDocs } from "@/lib/listing-rules";
import { getDict, isLocale } from "@/lib/i18n";
import type { VehicleType } from "@/lib/marketplace";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { authConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ locale: string; id: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "app", d.listings.docs.title, d.listings.docs.intro, { noindex: true });
}

export default async function TruckPage({ params }: P) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const d = await getDict(locale);
  if (!authConfigured()) redirect(href(locale, "login"));

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(href(locale, "login"));

  // Row-level security returns the truck only to members of the company that owns it.
  const { data: truck } = await supabase
    .from("trucks")
    .select("id,reference,status,vehicle_type,make_model,year,company_id,rejected_reason")
    .eq("id", id)
    .maybeSingle();
  if (!truck || !truck.company_id) notFound();
  const { data: docs } = await supabase.from("truck_documents").select("id,doc_type,file_name,size_bytes,storage_path").eq("truck_id", id).order("created_at");

  const status = truck.status as keyof typeof d.listings.my.statuses;
  const M = d.marketplace;
  return (
    <>
      <FormHero
        title={`${M.vehicles[truck.vehicle_type as VehicleType] ?? truck.vehicle_type} · ${truck.make_model}`}
        lead={`${truck.reference} · ${truck.year}`}
        back={d.listings.my.backToAccount}
        backHref={href(locale, "app")}
      >
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusChip tone={status === "published" ? "dark" : status === "pending_review" ? "gold" : status === "rejected" ? "danger" : "grey"}>{d.listings.my.statuses[status] ?? status}</StatusChip>
          <span className="text-sm text-muted">{d.listings.my.help[status] ?? ""}</span>
        </div>
      </FormHero>
      <Section className="!py-8 sm:!py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-2xl font-bold">{d.listings.docs.title}</h2>
          <TruckDocuments d={d} truckId={truck.id} companyId={truck.company_id} initial={(docs ?? []) as TruckDoc[]} recommended={recommendedTruckDocs(truck.vehicle_type as VehicleType)} />
        </div>
      </Section>
    </>
  );
}
