import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeadForm } from "@/components/forms/OtherForms";
import { PageHero, Section } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { CONTACT } from "@/lib/site";

type P = { params: Promise<{ locale: string }>; searchParams: Promise<{ corridor?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "contact", d.contact.title, d.contact.lead);
}

export default async function Contact({ params, searchParams }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const sp = await searchParams;
  const corridor = ["tz-zm", "tz-cd", "other"].includes(sp.corridor ?? "") ? sp.corridor : undefined;
  const c = d.contact;
  const channels = [
    { l: c.phone, v: CONTACT.phone, h: `tel:${CONTACT.phone.replace(/\s/g, "")}` },
    { l: c.whatsapp, v: CONTACT.phone, h: `https://wa.me/${CONTACT.whatsapp}` },
    { l: c.email, v: CONTACT.email, h: `mailto:${CONTACT.email}` },
    { l: c.social, v: CONTACT.handle, h: CONTACT.instagram },
  ];
  const addr = `${CONTACT.address.box}, ${CONTACT.address.city}, ${CONTACT.address.country}`;
  return (
    <>
      <PageHero title={c.title} lead={c.lead} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <LeadForm locale={locale} d={d} idPrefix="contact" defaultCorridor={corridor} />
          <aside>
            <h2 className="text-2xl font-bold">{c.channelsTitle}</h2>
            <ul className="mt-5 space-y-4">
              {channels.map((x) => (
                <li key={x.l} className="card !p-5">
                  <p className="eyebrow">{x.l}</p>
                  <a href={x.h} className="mt-1 block text-xl font-semibold underline decoration-gold decoration-2 underline-offset-4">{x.v}</a>
                </li>
              ))}
              <li className="card !p-5">
                <p className="eyebrow">{c.address}</p>
                <p className="mt-1 text-xl font-semibold">{addr}</p>
              </li>
            </ul>
          </aside>
        </div>
      </Section>
    </>
  );
}
