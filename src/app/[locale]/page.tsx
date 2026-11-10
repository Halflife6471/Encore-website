import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Audiences, CorridorsTeaser, FinalCta, Hero, Lifecycle, PartnerStrip, Pillars, VerificationExplainer } from "@/components/home-sections";
import { getDict, isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return { ...pageMeta(locale, "home", `${d.meta.siteName} — ${d.meta.tagline}`, d.meta.description), title: { absolute: `${d.meta.siteName} — ${d.meta.tagline}` } };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  return (
    <>
      <Hero locale={locale} d={d} />
      <Audiences locale={locale} d={d} />
      <Lifecycle locale={locale} d={d} />
      <Pillars d={d} />
      <CorridorsTeaser locale={locale} d={d} />
      <VerificationExplainer d={d} />
      <PartnerStrip locale={locale} d={d} />
      <FinalCta locale={locale} d={d} />
    </>
  );
}
