import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/home-sections";
import { IconChevron, PageHero, Section } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "faq", d.faq.title, d.faq.lead);
}

export default async function Faq({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const f = d.faq;
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: f.groups.flatMap((g) => g.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } }))),
  };
  return (
    <>
      <PageHero title={f.title} lead={f.lead} />
      <Section>
        <div className="mx-auto grid max-w-4xl gap-12">
          {f.groups.map((g, gi) => (
            <div key={g.t} id={`g${gi + 1}`}>
              <h2 className="mb-4 text-2xl font-bold">{g.t}</h2>
              <div className="divide-y divide-g1 rounded-3xl border border-g1">
                {g.items.map((it) => (
                  <details key={it.q} className="group px-6 py-4 open:bg-tint">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                      {it.q}
                      <IconChevron className="h-5 w-5 flex-none transition group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 leading-relaxed text-g3">{it.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
      <FinalCta locale={locale} d={d} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
