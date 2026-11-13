import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Team } from "@/components/about/AboutSections";
import { FinalCta } from "@/components/home-sections";
import { PageHero } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "team", `${d.nav.ourTeam} — ${d.about.team.title}`, d.about.team.lead);
}

export default async function TeamPage({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const t = d.about.team;
  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={d.nav.ourTeam} lead={t.lead} />
      <Team d={d} bare />
      <FinalCta locale={locale} d={d} />
    </>
  );
}
