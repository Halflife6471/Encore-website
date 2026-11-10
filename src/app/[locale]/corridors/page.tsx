import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CorridorMap } from "@/components/CorridorMap";
import { FinalCta } from "@/components/home-sections";
import { LinkButton, PageHero, Section, StatusChip } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "corridors", d.corridors.title, d.corridors.lead);
}

export default async function Corridors({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const c = d.corridors;
  const tone = ["dark", "gold", "grey"] as const;
  return (
    <>
      <PageHero title={c.title} lead={c.lead} />
      <Section>
        <CorridorMap d={c} />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {c.cards.map((card, i) => (
            <div key={card.t} className="card flex flex-col">
              <StatusChip tone={tone[i]}>{card.status}</StatusChip>
              <h2 className="mt-4 text-2xl font-bold">{card.t}</h2>
              <p className="mt-2 text-muted">{card.d}</p>
              {card.routes.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-[15px]">
                  {card.routes.map((r) => <li key={r} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-gold" />{r}</li>)}
                </ul>
              )}
              {i < 2 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <LinkButton href={href(locale, "contact", { corridor: i === 0 ? "tz-zm" : "tz-cd" })} className="btn-sm" variant="gold">{c.request}</LinkButton>
                  <LinkButton href={href(locale, "transporters")} className="btn-sm" variant="outline">{c.offer}</LinkButton>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-3xl rounded-2xl bg-soft p-4 text-sm text-muted">{c.border}</p>
      </Section>
      <FinalCta locale={locale} d={d} />
    </>
  );
}
