import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Projects, Services } from "@/components/about/AboutSections";
import { FinalCta } from "@/components/home-sections";
import { PageHero } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "services", `${d.nav.ourServices} — ${d.about.services.title}`, d.about.services.lead);
}

export default async function ServicesPage({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const s = d.about.services;
  return (
    <>
      <PageHero eyebrow={s.eyebrow} title={d.nav.ourServices} lead={s.lead} />
      <Services locale={locale} d={d} bare />
      <Projects d={d} />
      <FinalCta locale={locale} d={d} />
    </>
  );
}
