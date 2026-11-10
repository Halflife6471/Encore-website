import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero, Section } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { PRIVACY_VERSION } from "@/lib/site";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "privacy", d.legal.privacy.title, d.legal.privacy.intro);
}

export default async function Privacy({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const p = d.legal.privacy;
  return (
    <>
      <PageHero title={p.title} lead={p.intro} />
      <Section>
        <div className="prose-encore mx-auto max-w-3xl">
          <p className="rounded-2xl bg-goldsoft p-4 text-sm font-medium text-fg">{d.legal.draftNote} · {d.legal.updated} {PRIVACY_VERSION}</p>
          {p.sections.map((s) => (
            <div key={s.h}><h2>{s.h}</h2>{s.p.map((t) => <p key={t}>{t}</p>)}</div>
          ))}
        </div>
      </Section>
    </>
  );
}
