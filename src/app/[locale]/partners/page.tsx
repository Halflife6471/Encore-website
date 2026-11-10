import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeadForm } from "@/components/forms/OtherForms";
import { CheckList, InfoCard, NumberedSteps, PageHero, Section, SectionHead } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "partners", d.partners.title, d.partners.lead);
}

export default async function Partners({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const p = d.partners;
  return (
    <>
      <PageHero title={p.title} lead={p.lead} eyebrow={p.invitationOnly} />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div><SectionHead title={p.whoTitle} /><CheckList items={p.who} /></div>
          <div>
            <SectionHead title={p.typesTitle} />
            <div className="grid gap-5 md:grid-cols-2">{p.types.map((t) => <InfoCard key={t.t} title={t.t}>{t.d}</InfoCard>)}</div>
          </div>
        </div>
      </Section>
      <Section tint>
        <SectionHead title={p.howTitle} />
        <NumberedSteps items={p.how} />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <InfoCard title="✓" dark>{p.rewards}</InfoCard>
          <InfoCard title="🛡">{p.fraud}</InfoCard>
        </div>
      </Section>
      <Section>
        <div className="mx-auto max-w-2xl">
          <SectionHead title={p.formTitle} lead={p.invitationOnly} />
          <LeadForm locale={locale} d={d} leadType="partner" defaultCategory="partner" corridor={false} idPrefix="partner" />
        </div>
      </Section>
    </>
  );
}
