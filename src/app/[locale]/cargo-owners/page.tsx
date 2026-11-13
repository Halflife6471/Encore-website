import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/home-sections";
import { MarketplaceSection } from "@/components/marketplace/MarketplaceSection";
import { CheckList, InfoCard, LinkButton, NumberedSteps, PageHero, Section, SectionHead, StatusChip } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "cargoOwners", d.cargoOwners.title, d.cargoOwners.lead);
}

export default async function CargoOwners({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const c = d.cargoOwners;
  return (
    <>
      <PageHero title={c.title} lead={c.lead}>
        <LinkButton href={href(locale, "register")} variant="gold" arrow>{d.common.registerCargoOwner}</LinkButton>
        <LinkButton href={href(locale, "contact")} variant="outline">{d.common.contactUs}</LinkButton>
      </PageHero>
      <MarketplaceSection locale={locale} d={d} focus="truck" title={c.fleetTitle} lead={c.fleetLead} cta={c.fleetCta} />
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div><SectionHead title={c.getTitle} /><CheckList items={c.get} /></div>
          <div><SectionHead title={c.prepareTitle} /><CheckList items={c.prepare} /></div>
        </div>
      </Section>
      <Section tint>
        <SectionHead title={c.statusesTitle} />
        <ol className="flex flex-wrap items-center gap-3">
          {c.statuses.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <StatusChip tone={i === c.statuses.length - 1 ? "dark" : i === 0 ? "grey" : "gold"}>{s}</StatusChip>
              {i < c.statuses.length - 1 && <span aria-hidden className="text-g2">→</span>}
            </li>
          ))}
        </ol>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <InfoCard title={c.trustTitle}>{c.trust}</InfoCard>
          <InfoCard title={c.invoiceTitle} dark>{c.invoice}</InfoCard>
        </div>
      </Section>
      <Section>
        <SectionHead title={c.onboardingTitle} />
        <NumberedSteps items={c.onboarding} />
      </Section>
      <FinalCta locale={locale} d={d} />
    </>
  );
}
