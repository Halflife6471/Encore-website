import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeadForm } from "@/components/forms/OtherForms";
import { CheckList, InfoCard, LinkButton, PageHero, Section, SectionHead } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "drivers", d.drivers.title, d.drivers.lead);
}

export default async function Drivers({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const x = d.drivers;
  return (
    <>
      <PageHero title={x.title} lead={x.lead}>
        <LinkButton href={href(locale, "login")} arrow>{d.nav.login}</LinkButton>
      </PageHero>
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          <InfoCard title={x.howTitle} dark>{x.how}</InfoCard>
          <InfoCard title={x.needTitle}><CheckList items={x.need} /><p className="mt-4 text-sm">{x.privacy}</p></InfoCard>
        </div>
        <div className="mt-12"><SectionHead title={x.doTitle} /><CheckList items={x.do} className="max-w-3xl" /></div>
      </Section>
      <Section tint>
        <div className="mx-auto max-w-2xl">
          <SectionHead title={x.help} />
          <LeadForm locale={locale} d={d} leadType="driver_help" defaultCategory="driver" corridor={false} idPrefix="driver" />
        </div>
      </Section>
    </>
  );
}
