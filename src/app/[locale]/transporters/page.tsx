import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/home-sections";
import { CheckList, InfoCard, LinkButton, NumberedSteps, PageHero, Section, SectionHead } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "transporters", d.transporters.title, d.transporters.lead);
}

export default async function Transporters({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const t = d.transporters;
  return (
    <>
      <PageHero title={t.title} lead={t.lead}>
        <LinkButton href={href(locale, "register")} variant="gold" arrow>{d.common.registerTransporter}</LinkButton>
        <LinkButton href={href(locale, "contact")} variant="outline">{d.common.contactUs}</LinkButton>
      </PageHero>
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div><SectionHead title={t.whoTitle} lead={t.who} /></div>
          <div><SectionHead title={t.manageTitle} /><CheckList items={t.manage} /></div>
        </div>
      </Section>
      <Section tint>
        <SectionHead title={t.onboardingTitle} lead={t.note} />
        <NumberedSteps items={t.onboarding} />
      </Section>
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHead title={t.docsTitle} lead={t.docsNote} />
            <CheckList items={t.docs} />
          </div>
          <div><SectionHead title={t.truckTitle} /><CheckList items={t.truck} /></div>
        </div>
      </Section>
      <Section tint>
        <div className="grid gap-5 md:grid-cols-2">
          <InfoCard title={t.settlementTitle} dark>{t.settlement}</InfoCard>
          <InfoCard title={t.securityTitle}>{t.security}</InfoCard>
        </div>
      </Section>
      <FinalCta locale={locale} d={d} />
    </>
  );
}
