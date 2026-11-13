import Image from "next/image";
import Link from "next/link";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { href } from "@/lib/routes";
import { IconSnow } from "../marketplace/icons";
import { CheckList, IconArrow, IconBox, IconCheck, IconTruck, LinkButton, Section, SectionHead } from "../ui";
import { CertificateGallery } from "./CertificateGallery";
import { IconBriefcase, IconClipboard, IconWarehouse } from "./icons";

const CERT_FILES = [
  { src: "/certificates/brela-incorporation.jpg", width: 970, height: 1367 },
  { src: "/certificates/tra-tin.jpg", width: 967, height: 1344 },
  { src: "/certificates/tra-tax-clearance.jpg", width: 920, height: 1302 },
];
const TEAM_PHOTOS = ["/team/jenhandebo.jpg", "/team/mvula.jpg", "/team/mlindila.jpg"];
const PROJECT_PHOTOS = [
  "/projects/kolwezi-containers.jpg",
  "/projects/dar-lusaka-loose-cargo.jpg",
  "/projects/lubumbashi-containers.jpg",
  "/projects/fuel-transport.jpg",
  "/projects/cat-backhoe.jpg",
];

/* -------------------------------------------------------------- Who we are */
export function WhoWeAre({ d }: { d: Dict }) {
  const w = d.about.who;
  return (
    <Section tint>
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div>
          <SectionHead eyebrow={w.eyebrow} title={w.title} lead={w.text} />
          <p className="eyebrow">{w.sectorsTitle}</p>
          <ul className="mt-3 flex flex-wrap gap-2.5">
            {w.sectors.map((s) => (
              <li key={s} className="rounded-full border border-line bg-surface px-4 py-2 text-[15px] font-semibold">{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">{w.whyTitle}</p>
          <ol className="space-y-3">
            {w.why.map((x, i) => (
              <li key={x.t} className="flex gap-4 rounded-3xl border border-line bg-surface p-5 shadow-soft">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-ink text-sm font-bold text-gold">{i + 1}</span>
                <div>
                  <h3 className="text-lg font-bold">{x.t}</h3>
                  <p className="mt-1 text-muted">{x.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- Services */
export function Services({ locale, d, bare = false }: { locale: Locale; d: Dict; bare?: boolean }) {
  const s = d.about.services;
  const m = s.marketplace;
  const audienceIcons = [IconBox, IconTruck, IconBriefcase];
  const audienceLinks = [href(locale, "register"), href(locale, "register"), href(locale, "partners")];
  const itemIcons = [IconClipboard, IconWarehouse, IconTruck, IconSnow];

  return (
    <Section tint={!bare} id="services" className="scroll-mt-20">
      {!bare && <SectionHead eyebrow={s.eyebrow} title={s.title} lead={s.lead} />}

      {/* Service number one: the marketplace that joins everyone in the freight chain */}
      <div className="relative overflow-hidden rounded-[2rem] bg-ink p-7 text-white sm:p-10">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="relative">
          <span className="chip bg-gold text-ongold">1 · {m.tag}</span>
          <h3 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{m.title}</h3>
          <p className="mt-3 max-w-3xl text-lg font-light leading-relaxed text-g1">{m.text}</p>

          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {m.audiences.map((a, i) => {
              const Icon = audienceIcons[i];
              return (
                <li key={a.t} className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-gold text-ongold"><Icon className="h-6 w-6" /></span>
                  <h4 className="mt-4 text-xl font-bold">{a.t}</h4>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-g1">{a.d}</p>
                  <Link href={audienceLinks[i]} className="mt-4 inline-flex items-center gap-2 font-semibold text-gold underline decoration-gold/50 decoration-2 underline-offset-4 hover:decoration-gold">
                    {a.cta} <IconArrow className="h-4 w-4" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href={href(locale, "marketplace")} variant="gold" arrow>{m.browse}</LinkButton>
            <LinkButton href={href(locale, "howItWorks")} variant="outline" className="!border-white !text-white hover:!bg-white hover:!text-ongold">{m.how}</LinkButton>
          </div>
        </div>
      </div>

      {/* The group's other services */}
      <p className="eyebrow mb-5 mt-12">{s.itemsTitle}</p>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {s.items.map((it, i) => {
          const Icon = itemIcons[i];
          return (
            <li key={it.t} className="card flex flex-col">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-goldsoft text-fg"><Icon className="h-6 w-6" /></span>
              <h4 className="mt-4 text-xl font-bold">
                <span className="mr-1.5 text-muted">{i + 2}.</span>{it.t}
              </h4>
              <p className="mt-2 text-muted">{it.d}</p>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-sm text-muted">{d.common.srsNote}</p>
    </Section>
  );
}

/* -------------------------------------------------------------------- Team */
export function Team({ d, bare = false }: { d: Dict; bare?: boolean }) {
  const t = d.about.team;
  return (
    <Section id="team" className="scroll-mt-20">
      {!bare && <SectionHead eyebrow={t.eyebrow} title={t.title} lead={t.lead} />}
      <ul className="grid gap-6 md:grid-cols-3">
        {t.members.map((m, i) => (
          <li key={m.name} className="group overflow-hidden rounded-[2rem] border border-line bg-surface shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
            <div className="relative aspect-[4/5] overflow-hidden bg-soft">
              <Image
                src={TEAM_PHOTOS[i]}
                alt={m.name}
                fill
                sizes="(min-width: 1024px) 380px, (min-width: 768px) 33vw, 100vw"
                className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
              />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1.5 bg-gold" />
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold leading-tight">{m.name}</h3>
              <p className="mt-2"><span className="chip bg-gold text-ongold !normal-case !tracking-normal">{m.role}</span></p>
              <p className="mt-4 leading-relaxed text-muted">{m.bio}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-14 rounded-[2rem] border border-line bg-soft p-6 sm:p-8">
        <h3 className="text-2xl font-bold">{t.structureTitle}</h3>
        <p className="mt-2 max-w-3xl text-muted">{t.structureText}</p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.divisions.map((x, i) => (
            <li key={x} className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-ink text-sm font-bold text-gold">{i + 1}</span>
              <span className="font-semibold leading-snug">{x}</span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- Projects */
export function Projects({ d }: { d: Dict }) {
  const p = d.about.projects;
  return (
    <Section tint>
      <SectionHead eyebrow={p.eyebrow} title={p.title} lead={p.lead} />
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
        {p.items.map((it, i) => (
          <li key={it.t} className={`overflow-hidden rounded-3xl border border-line bg-surface shadow-soft ${i < 3 ? "lg:col-span-2" : "lg:col-span-3"} ${i === 4 ? "sm:col-span-2 lg:col-span-3" : ""}`}>
            <div className={`relative bg-soft ${i < 3 ? "aspect-[3/2]" : "aspect-[16/9]"}`}>
              <Image src={PROJECT_PHOTOS[i]} alt={it.t} fill sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" className={`object-cover ${i === 1 ? "object-left" : i === 3 ? "object-[50%_70%]" : ""}`} />
            </div>
            <div className="p-5">
              <span className="chip bg-line text-fg">{it.tag}</span>
              <h3 className="mt-3 text-lg font-bold leading-snug">{it.t}</h3>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------- Legal */
export function Legal({ d }: { d: Dict }) {
  const l = d.about.legal;
  return (
    <Section id="legal" className="scroll-mt-20">
      <SectionHead eyebrow={l.eyebrow} title={l.title} />
      <div className="grid gap-6 lg:grid-cols-2">
        <dl className="card divide-y divide-line !py-2">
          {l.rows.map((r) => (
            <div key={r.k} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
              <dt className="text-sm font-medium text-muted">{r.k}</dt>
              <dd className="font-semibold">{r.v}</dd>
            </div>
          ))}
        </dl>
        <div className="rounded-3xl border border-goldline bg-goldsoft p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gold text-ongold"><IconCheck className="h-5 w-5" /></span>
            <h3 className="text-xl font-bold">{l.clauseTitle}</h3>
          </div>
          <CheckList className="mt-5" items={l.points} />
        </div>
      </div>

      <div className="mt-14">
        <h3 className="text-2xl font-bold tracking-tight">{l.certsTitle}</h3>
        <p className="mt-2 mb-8 max-w-3xl text-muted">{l.certsLead}</p>
        <CertificateGallery
          certs={l.certs.map((c, i) => ({ ...CERT_FILES[i], title: c.t, issuer: c.issuer, note: c.d }))}
          labels={{ issuedBy: l.issuedBy, enlarge: l.enlarge, close: l.close, prev: l.prev, next: l.next }}
        />
      </div>
    </Section>
  );
}

/* --------------------------------------------- links from About to the new pages */
export function ExploreMore({ locale, d }: { locale: Locale; d: Dict }) {
  const e = d.about.explore;
  const cards = [
    { to: href(locale, "services"), t: e.services, text: e.servicesText },
    { to: href(locale, "team"), t: e.team, text: e.teamText },
  ];
  return (
    <Section>
      <p className="eyebrow mb-5">{e.eyebrow}</p>
      <ul className="grid gap-5 md:grid-cols-2">
        {cards.map((c) => (
          <li key={c.to}>
            <Link href={c.to} className="card group flex h-full items-center justify-between gap-6 transition hover:-translate-y-1 hover:shadow-lift">
              <span>
                <span className="block text-2xl font-bold">{c.t}</span>
                <span className="mt-2 block text-muted">{c.text}</span>
              </span>
              <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-gold text-ongold transition group-hover:translate-x-1"><IconArrow className="h-5 w-5" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
