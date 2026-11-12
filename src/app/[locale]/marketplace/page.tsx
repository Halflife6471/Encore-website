import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketplaceBrowser } from "@/components/marketplace/MarketplaceBrowser";
import { IconInfo } from "@/components/marketplace/icons";
import { LinkButton, Section } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { getMarketplace } from "@/lib/marketplace-data";
import { pageMeta } from "@/lib/seo";
import { CONTACT } from "@/lib/site";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "marketplace", `${d.marketplace.eyebrow} — ${d.marketplace.title}`, d.marketplace.lead);
}

export default async function Marketplace({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const m = d.marketplace;
  const { listings, tier, base } = await getMarketplace();

  return (
    <>
      <div className="relative overflow-hidden border-b border-line bg-surface">
        <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-56 w-[30rem] rounded-full bg-gold/25 blur-3xl" />
        <div className="container-x relative py-9 sm:py-12">
          <p className="eyebrow mb-2">{m.eyebrow}</p>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">{m.title}</h1>
          <p className="mt-4 max-w-3xl text-base font-light leading-relaxed text-muted sm:text-lg">{m.lead}</p>
        </div>
      </div>

      <Section className="!py-8 sm:!py-10">
        <div className="mb-8 flex gap-3 rounded-2xl border border-goldline bg-goldsoft p-4 sm:p-5" role="note">
          <IconInfo className="mt-0.5 h-5 w-5 flex-none" />
          <p className="text-[15px] leading-relaxed"><b>{m.sampleBanner}.</b> {m.sampleText}</p>
        </div>

        <MarketplaceBrowser
          d={m}
          locale={locale}
          base={base}
          listings={listings}
          tier={tier}
          links={{ login: href(locale, "login"), register: href(locale, "register"), app: href(locale, "app"), whatsapp: CONTACT.whatsapp }}
        />
      </Section>

      <Section tint>
        <h2 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl">{m.howTitle}</h2>
        <ol className="grid gap-5 md:grid-cols-3">
          {m.how.map((s, i) => (
            <li key={s.t} className="card">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-base font-bold text-gold">{i + 1}</span>
              <h3 className="mt-4 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </Section>

      <section className="bg-ink text-white">
        <div className="container-x flex flex-col items-start justify-between gap-8 py-16 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{m.cta.title}</h2>
            <p className="mt-3 text-lg font-light text-g1">{m.cta.text}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton href={href(locale, "register")} variant="gold" arrow>{m.cta.cargo}</LinkButton>
            <LinkButton href={href(locale, "register")} variant="outline" className="!border-white !text-white hover:!bg-white hover:!text-ongold">{m.cta.transporter}</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
