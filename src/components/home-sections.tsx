import Link from "next/link";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { href, type RouteKey } from "@/lib/routes";
import { CorridorMap } from "./CorridorMap";
import { IconArrow, IconBox, IconLink, IconStar, IconTruck, IconWheel, LinkButton, Section, SectionHead } from "./ui";

export function Hero({ locale, d }: { locale: Locale; d: Dict }) {
  const h = d.home.hero;
  return (
    <section className="relative overflow-hidden border-b border-g1 bg-white">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-1/3 h-[26rem] w-[40rem] rounded-full bg-gold/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute left-1/3 top-1/2 h-[26rem] w-[40rem] rounded-full bg-g2/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-24 hidden h-[44rem] w-[44rem] rounded-full border border-g1 lg:block" />
      <div aria-hidden className="pointer-events-none absolute -right-4 top-16 hidden h-[30rem] w-[30rem] rounded-full border border-g1 lg:block" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 right-16 top-0 hidden border-l border-dashed border-g2 lg:block" />

      <div className="container-x relative grid gap-10 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-8 lg:pb-24 lg:pt-20">
        <h1 className="text-[clamp(2.7rem,7.4vw,6rem)] font-extrabold leading-[0.97] tracking-[-0.025em]">
          <span className="block">{h.a}</span>
          <span className="block">{h.b}</span>
          <span className="block font-bold italic">{h.c}</span>
        </h1>
        <div className="lg:pr-20 lg:pt-4">
          <p className="max-w-lg text-lg font-light leading-relaxed text-g3 sm:text-xl">{h.lead}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <IconStar className="hidden h-9 w-9 sm:block" />
            <LinkButton href={href(locale, "register")} arrow>{h.primary}</LinkButton>
            <LinkButton href={href(locale, "howItWorks")} variant="outline">{h.secondary}</LinkButton>
          </div>
        </div>
        <ol className="flex flex-wrap gap-3 lg:col-span-2 lg:mt-4" aria-label="Verify, Match, Deliver, Repeat">
          {d.home.cycle.map((c, i) => (
            <li key={c} className="flex items-center gap-2.5 rounded-full border border-g1 bg-white/80 py-2 pl-2 pr-5 text-[15px] font-semibold backdrop-blur">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gold text-xs font-extrabold">{i + 1}</span>
              {c}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Audiences({ locale, d }: { locale: Locale; d: Dict }) {
  const a = d.home.audiences;
  const meta: Record<string, { icon: typeof IconBox; to: RouteKey }> = {
    cargo: { icon: IconBox, to: "cargoOwners" },
    transporter: { icon: IconTruck, to: "transporters" },
    driver: { icon: IconWheel, to: "drivers" },
    partner: { icon: IconLink, to: "partners" },
  };
  return (
    <Section>
      <SectionHead eyebrow={a.eyebrow} title={a.title} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {a.items.map((it) => {
          const m = meta[it.key];
          return (
            <Link key={it.key} href={href(locale, m.to)} className="card group flex flex-col transition hover:-translate-y-1 hover:shadow-lift">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-goldtint transition group-hover:bg-gold"><m.icon className="h-6 w-6" /></span>
              <h3 className="mt-5 text-xl font-bold">{it.t}</h3>
              <p className="mt-2 flex-1 leading-relaxed text-g3">{it.d}</p>
              <span className="mt-5 inline-flex items-center gap-2 font-semibold">{it.cta}<IconArrow className="h-[18px] w-[18px] transition group-hover:translate-x-1" /></span>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

export function Lifecycle({ locale, d, link = true }: { locale: Locale; d: Dict; link?: boolean }) {
  const l = d.home.lifecycle;
  return (
    <Section tint>
      <SectionHead eyebrow={l.eyebrow} title={l.title} lead={l.intro} />
      <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
        <span aria-hidden className="absolute left-0 right-0 top-6 hidden border-t-[3px] border-dotted border-g2 lg:block" />
        {l.steps.map((s, i) => (
          <li key={s.t} className="relative">
            <span className={`relative grid h-12 w-12 place-items-center rounded-full text-base font-extrabold ${i === 0 || i === l.steps.length - 1 ? "bg-char text-gold" : "bg-gold text-char"}`}>{i + 1}</span>
            <h3 className="mt-4 text-lg font-bold uppercase tracking-wide">{s.t}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-g3">{s.d}</p>
          </li>
        ))}
      </ol>
      {link && <div className="mt-10"><LinkButton href={href(locale, "howItWorks")} variant="outline" arrow>{d.nav.howItWorks}</LinkButton></div>}
    </Section>
  );
}

export function Pillars({ d }: { d: Dict }) {
  const p = d.home.pillars;
  return (
    <Section dark>
      <SectionHead eyebrow={p.eyebrow} title={p.title} dark />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {p.items.map((it, i) => (
          <div key={it.t} className="rounded-3xl border border-g3 bg-g3/30 p-6">
            <span className="text-4xl font-extrabold text-gold">0{i + 1}</span>
            <h3 className="mt-4 text-xl font-bold">{it.t}</h3>
            <p className="mt-2 font-light leading-relaxed text-g1">{it.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function CorridorsTeaser({ locale, d }: { locale: Locale; d: Dict }) {
  const c = d.home.corridors;
  return (
    <Section>
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <SectionHead eyebrow={c.eyebrow} title={c.title} lead={c.text} />
          <LinkButton href={href(locale, "corridors")} arrow>{c.cta}</LinkButton>
        </div>
        <CorridorMap d={d.corridors} />
      </div>
    </Section>
  );
}

export function VerificationExplainer({ d }: { d: Dict }) {
  const v = d.home.verification;
  const tones = ["bg-g1 text-char", "bg-gold text-char", "bg-char text-white"];
  return (
    <Section tint>
      <SectionHead eyebrow={v.eyebrow} title={v.title} lead={v.text} />
      <div className="grid gap-5 md:grid-cols-3">
        {v.steps.map((s, i) => (
          <div key={s.t} className="card">
            <span className={`chip ${tones[i]}`}>{s.t}</span>
            <p className="mt-4 leading-relaxed text-g3">{s.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function PartnerStrip({ locale, d }: { locale: Locale; d: Dict }) {
  const p = d.home.partner;
  return (
    <Section className="!py-12">
      <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-[#FFE08A] bg-gradient-to-r from-goldtint to-white p-8 sm:flex-row sm:items-center sm:p-10">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold sm:text-3xl">{p.title}</h2>
          <p className="mt-2 text-g3">{p.text}</p>
        </div>
        <LinkButton href={href(locale, "partners")} arrow>{p.cta}</LinkButton>
      </div>
    </Section>
  );
}

export function FinalCta({ locale, d }: { locale: Locale; d: Dict }) {
  const f = d.home.finalCta;
  return (
    <section className="bg-char text-white">
      <div className="container-x flex flex-col items-start justify-between gap-8 py-16 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{f.title}</h2>
          <p className="mt-3 text-lg font-light text-g1">{f.text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={href(locale, "register")} variant="gold" arrow>{d.common.createAccount}</LinkButton>
          <LinkButton href={href(locale, "contact")} variant="outline" className="!border-white !text-white hover:!bg-white hover:!text-char">{d.common.contactUs}</LinkButton>
        </div>
      </div>
    </section>
  );
}
