import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/home-sections";
import { InfoCard, PageHero, Section, SectionHead } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "about", d.about.title, d.about.lead);
}

export default async function About({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const a = d.about;
  return (
    <>
      <PageHero title={a.title} lead={a.lead} />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <InfoCard title={a.vision.t} dark>{a.vision.d}</InfoCard>
          <InfoCard title={a.mission.t}>{a.mission.d}</InfoCard>
        </div>
        <div className="mt-6 rounded-3xl border border-goldline bg-goldsoft p-8">
          <h2 className="text-2xl font-bold">{a.principle.t}</h2>
          <p className="mt-3 max-w-4xl leading-relaxed text-muted">{a.principle.d}</p>
        </div>
      </Section>
      <Section tint>
        <SectionHead title={a.commitmentsTitle} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {a.commitments.map((c) => <InfoCard key={c.t} title={c.t}>{c.d}</InfoCard>)}
        </div>
        <p className="mt-10 text-2xl font-semibold italic">“{a.accountability}”</p>
      </Section>
      <Section>
        <SectionHead title={a.whereTitle} lead={a.where} />
        <p className="text-sm text-muted">{a.note}</p>
      </Section>
      <FinalCta locale={locale} d={d} />
    </>
  );
}
