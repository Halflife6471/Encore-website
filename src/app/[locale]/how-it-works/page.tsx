import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FinalCta, Lifecycle } from "@/components/home-sections";
import { InfoCard, LinkButton, PageHero, Section } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "howItWorks", d.how.title, d.how.lead);
}

export default async function HowItWorks({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const h = d.how;
  return (
    <>
      <PageHero title={h.title} lead={h.lead}>
        <LinkButton href={href(locale, "register")} arrow>{d.common.createAccount}</LinkButton>
      </PageHero>
      <Lifecycle locale={locale} d={d} link={false} />
      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="text-2xl font-bold">{h.tabs.cargo}</h2>
            <ol className="mt-5 space-y-3">
              {h.cargoSteps.map((s, i) => (
                <li key={s} className="flex items-start gap-3"><span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-gold text-sm font-bold">{i + 1}</span><span className="text-muted">{s}</span></li>
              ))}
            </ol>
            <div className="mt-6"><LinkButton href={href(locale, "register")} variant="gold" className="btn-sm">{d.common.registerCargoOwner}</LinkButton></div>
          </div>
          <div className="card">
            <h2 className="text-2xl font-bold">{h.tabs.trucks}</h2>
            <ol className="mt-5 space-y-3">
              {h.truckSteps.map((s, i) => (
                <li key={s} className="flex items-start gap-3"><span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-ink text-sm font-bold text-gold">{i + 1}</span><span className="text-muted">{s}</span></li>
              ))}
            </ol>
            <div className="mt-6"><LinkButton href={href(locale, "register")} variant="gold" className="btn-sm">{d.common.registerTransporter}</LinkButton></div>
          </div>
        </div>
      </Section>
      <Section tint>
        <div className="grid gap-5 md:grid-cols-2">
          {h.sections.map((s, i) => <InfoCard key={s.t} title={s.t} dark={i === 2}>{s.d}</InfoCard>)}
        </div>
        <p className="mt-8 max-w-3xl text-sm text-muted">{d.common.srsNote}</p>
      </Section>
      <FinalCta locale={locale} d={d} />
    </>
  );
}
