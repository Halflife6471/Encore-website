"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import {
  matchingLoads, matchingTrucks, missingFeatures, perTruckT,
  type Listing, type Load, type Truck,
} from "@/lib/marketplace";
import type { Locale } from "@/lib/i18n-config";
import { IconArrow, IconCheck, IconChat, IconClose, StatusChip } from "../ui";
import { VerificationChip } from "./Cards";
import { IconAlert, IconInfo, IconSnow, IconStarSolid } from "./icons";
import { TruckArt } from "./TruckArt";
import { dateRange, km, makeDate, posted, tonnes, tpl, usd, type MP } from "./fmt";

type Links = { login: string; register: string; whatsapp: string };
type Fmt = ReturnType<typeof makeDate>;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-5">
      <h3 className="mb-3 text-[13px] font-bold uppercase tracking-[0.14em] text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-5 gap-y-3.5 sm:gap-x-6">{children}</dl>;
}
function Row({ k, children, wide = false }: { k: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-xs font-medium text-muted">{k}</dt>
      <dd className="mt-0.5 font-semibold leading-snug">{children}</dd>
    </div>
  );
}

function Checks({ items, have }: { items: string[]; have?: boolean[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((t, i) => (
        <li key={t} className="flex items-start gap-2.5 text-[15px]">
          <span className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full ${have && !have[i] ? "bg-line text-muted" : "bg-gold text-ongold"}`}>
            <IconCheck className="h-3 w-3" />
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Origin — border crossings — destination, drawn as a route line. */
function RouteLine({ l, d }: { l: Load; d: MP }) {
  const stops = [
    { label: l.origin.city, sub: d.countries[l.origin.cc], end: true },
    ...l.borders.map((b) => ({ label: b, sub: "", end: false })),
    { label: l.destination.city, sub: d.countries[l.destination.cc], end: true },
  ];
  return (
    <div className="rounded-2xl bg-soft p-4 sm:p-5">
      <ol className="flex items-start">
        {stops.map((s, i) => (
          <li key={i} className={`relative flex min-w-0 flex-1 flex-col ${i === 0 ? "items-start text-left" : i === stops.length - 1 ? "items-end text-right" : "items-center text-center"}`}>
            <span className="relative z-10 flex w-full items-center">
              {i > 0 && <span className="h-0.5 flex-1 bg-fg/30" />}
              <span className={`grid flex-none place-items-center rounded-full border-2 border-fg ${s.end ? "h-5 w-5 bg-gold" : "h-3.5 w-3.5 bg-surface"}`} />
              {i < stops.length - 1 && <span className="h-0.5 flex-1 bg-fg/30" />}
            </span>
            <span className={`mt-2 max-w-full break-words font-bold leading-tight ${s.end ? "text-base sm:text-lg" : "text-xs font-semibold text-muted sm:text-sm"}`}>{s.label}</span>
            {s.sub && <span className="text-xs text-muted">{s.sub}</span>}
          </li>
        ))}
      </ol>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium text-muted">
        <span>{d.card.distance}: <b className="text-fg">{km(l.km)}</b></span>
        <span>{d.card.transit}: <b className="text-fg">{l.transit[0]}–{l.transit[1]} {d.card.days}</b></span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- Load body */
function LoadBody({ l, d, locale, base, onSelect }: { l: Load; d: MP; locale: Locale; base: number; onSelect: (r: string) => void }) {
  const fmt: Fmt = makeDate(locale);
  const trucks = matchingTrucks(l);
  return (
    <div className="space-y-5">
      <RouteLine l={l} d={d} />
      {l.borders.length === 0 && <p className="text-sm text-muted">{d.detail.noBorders}</p>}

      <Section title={d.detail.cargoSection}>
        <Grid>
          <Row k={d.detail.commodity} wide>{l.commodity[locale]}</Row>
          <Row k={d.detail.cargoType}>{d.cargoTypes[l.cargoType]}</Row>
          <Row k={d.detail.packaging}>{d.packaging[l.packaging]}</Row>
          <Row k={d.detail.totalWeight}>{tonnes(l.weightT)}</Row>
          <Row k={d.detail.perTruckWeight}>{tonnes(perTruckT(l))}</Row>
          {l.volumeCbm && <Row k={d.detail.volume}>{l.volumeCbm} m³</Row>}
          {l.piece && <Row k={d.detail.piece}>{l.piece}</Row>}
          {l.temp && <Row k={d.detail.temp}><span className="inline-flex items-center gap-1.5"><IconSnow className="h-4 w-4" />{l.temp[0]} – {l.temp[1]} °C</span></Row>}
          {l.hazmat && <Row k={d.detail.hazmat}><span className="inline-flex items-center gap-1.5 text-danger"><IconAlert className="h-4 w-4" />{l.hazmat}</span></Row>}
        </Grid>
        {l.note && <p className="mt-4 flex gap-2.5 rounded-xl bg-goldsoft p-3.5 text-sm"><IconInfo className="mt-0.5 h-4 w-4 flex-none" /><span><b>{d.detail.note}: </b>{l.note[locale]}</span></p>}
      </Section>

      <Section title={d.detail.schedule}>
        <Grid>
          <Row k={d.detail.pickupWindow}>{dateRange(fmt, base, l.pickup)}</Row>
          <Row k={d.detail.deliveryDeadline}>{fmt(base, l.deliveryBy)}</Row>
          <Row k={d.detail.transitTime}>{l.transit[0]}–{l.transit[1]} {d.card.days}</Row>
        </Grid>
      </Section>

      <Section title={d.detail.vehicleSection}>
        <Grid>
          <Row k={d.detail.vehicleType}>{d.vehicles[l.truckType]}</Row>
          <Row k={d.detail.trucksNeeded}>{l.trucks}</Row>
        </Grid>
        <p className="mb-2 mt-4 text-xs font-medium text-muted">{d.detail.requirements}</p>
        <Checks items={l.reqs.map((r) => d.features[r])} />
        <p className="mb-2 mt-4 text-xs font-medium text-muted">{d.detail.documents}</p>
        <Checks items={l.docs.map((x) => d.docs[x])} />
      </Section>

      <Section title={d.detail.commercial}>
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-goldsoft px-4 py-3.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{d.detail.budget}</p>
            <p className="text-2xl font-extrabold">USD {usd(l.budget[0])} – {usd(l.budget[1])}</p>
          </div>
          <p className="text-sm font-medium text-muted">{d.detail.perTruck}</p>
        </div>
        <Grid>
          <Row k={d.detail.terms} wide><span className="font-medium">{d.detail.termsValue}</span></Row>
        </Grid>
      </Section>

      <Section title={d.detail.owner}>
        <Grid>
          <Row k={d.detail.owner}><span className="inline-flex flex-wrap items-center gap-2">{l.owner.city}, {d.countries[l.owner.cc]} <VerificationChip v={l.owner.verification} d={d} /></span></Row>
          <Row k={d.detail.ownerSector}>{d.sectors[l.owner.sector]}</Row>
          <Row k={d.detail.memberSince}>{l.owner.since}</Row>
          <Row k={d.detail.shipments}>{l.owner.shipments}</Row>
        </Grid>
      </Section>

      <Section title={d.detail.matchTrucks}>
        {trucks.length === 0 ? (
          <p className="text-sm text-muted">{d.detail.noMatches}</p>
        ) : (
          <ul className="space-y-2.5">
            {trucks.map((t) => {
              const miss = missingFeatures(t, l);
              return (
                <li key={t.ref}>
                  <button type="button" onClick={() => onSelect(t.ref)} className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-3 text-left transition hover:border-fg">
                    <TruckArt type={t.type} className="h-12 w-24 flex-none" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{t.make} · {tonnes(t.payloadT)}</span>
                      <span className="block text-sm text-muted">{t.location.city}, {t.location.cc} · {t.ref}</span>
                      <span className={`mt-0.5 block text-xs font-semibold ${miss.length ? "text-muted" : "text-ok"}`}>
                        {miss.length ? tpl(d.detail.missing, { list: miss.map((m) => d.features[m]).join(", ") }) : d.detail.fits}
                      </span>
                    </span>
                    <IconArrow className="h-5 w-5 flex-none text-muted" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------ Truck body */
function TruckBody({ t, d, locale, base, onSelect }: { t: Truck; d: MP; locale: Locale; base: number; onSelect: (r: string) => void }) {
  const fmt: Fmt = makeDate(locale);
  const loads = matchingLoads(t);
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-b from-soft to-surface px-4 pt-3 sm:px-8">
        <TruckArt type={t.type} className="mx-auto h-32 w-full max-w-[340px]" />
      </div>

      <Section title={d.detail.specs}>
        <Grid>
          <Row k={d.detail.vehicleType}>{d.vehicles[t.type]}</Row>
          <Row k={d.detail.make}>{t.make}</Row>
          <Row k={d.detail.year}>{t.year}</Row>
          <Row k={d.detail.axles}>{t.axles}</Row>
          <Row k={d.detail.payload}>{tonnes(t.payloadT)}</Row>
          <Row k={d.detail.body}>{t.body}</Row>
        </Grid>
      </Section>

      <Section title={d.detail.availability}>
        <Grid>
          <Row k={d.detail.currentLocation}>{t.location.city}, {d.countries[t.location.cc]}</Row>
          <Row k={d.detail.availableFrom}>{t.availIn === 0 ? d.status.now : fmt(base, t.availIn)}</Row>
          <Row k={d.detail.corridors} wide>
            <span className="flex flex-wrap gap-1.5">
              {t.routes.map((r) => <span key={r} className="rounded-full border border-line bg-soft px-2.5 py-1 text-xs font-semibold">{d.corridors[r]}</span>)}
            </span>
          </Row>
        </Grid>
      </Section>

      <Section title={d.detail.capabilities}>
        <Checks items={t.features.map((f) => d.features[f])} />
      </Section>

      <Section title={d.detail.commercial}>
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-goldsoft px-4 py-3.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{d.detail.rate}</p>
            <p className="text-2xl font-extrabold">USD {t.rate[0].toFixed(1)} – {t.rate[1].toFixed(1)}</p>
          </div>
          <p className="text-sm font-medium text-muted">{d.detail.perKm}</p>
        </div>
        <Grid>
          <Row k={d.detail.terms} wide><span className="font-medium">{d.detail.termsValue}</span></Row>
        </Grid>
      </Section>

      <Section title={d.detail.transporter}>
        <Grid>
          <Row k={d.detail.reference}><span className="inline-flex flex-wrap items-center gap-2">{t.transporter.ref} <VerificationChip v={t.transporter.verification} d={d} /></span></Row>
          <Row k={d.detail.currentLocation}>{t.transporter.city}, {d.countries[t.transporter.cc]}</Row>
          <Row k={d.detail.rating}><span className="inline-flex items-center gap-1"><IconStarSolid className="h-4 w-4 text-gold" />{t.transporter.rating.toFixed(1)} / 5</span></Row>
          <Row k={d.detail.completedTrips}>{t.transporter.trips.toLocaleString("en-US")}</Row>
          <Row k={d.detail.fleetSize}>{t.transporter.fleet}</Row>
          <Row k={d.detail.yearsOperating}>{t.transporter.years}</Row>
          <Row k={d.detail.replyTime}>{tpl(d.detail.replyValue, { n: t.transporter.replyHours })}</Row>
        </Grid>
      </Section>

      <Section title={d.detail.matchLoads}>
        {loads.length === 0 ? (
          <p className="text-sm text-muted">{d.detail.noMatches}</p>
        ) : (
          <ul className="space-y-2.5">
            {loads.map((l) => (
              <li key={l.ref}>
                <button type="button" onClick={() => onSelect(l.ref)} className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-3 text-left transition hover:border-fg">
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{l.origin.city} → {l.destination.city}</span>
                    <span className="block text-sm text-muted">{l.commodity[locale]} · {tonnes(perTruckT(l))} · {dateRange(fmt, base, l.pickup)}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-muted">USD {usd(l.budget[0])} – {usd(l.budget[1])} · {l.ref}</span>
                  </span>
                  <IconArrow className="h-5 w-5 flex-none text-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

/* ----------------------------------------------------------------- Modal */
export function ListingDetail({
  listing, d, locale, base, links, onClose, onSelect,
}: {
  listing: Listing; d: MP; locale: Locale; base: number; links: Links; onClose: () => void; onSelect: (ref: string) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const isLoad = listing.kind === "load";

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  // Focus + scroll to top whenever a different listing is shown (e.g. via "matches").
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    closeRef.current?.focus();
  }, [listing.ref]);

  const title = isLoad ? `${listing.origin.city} → ${listing.destination.city}` : `${d.vehicles[listing.type]} · ${listing.make}`;
  const wa = isLoad
    ? tpl(d.detail.waLoad, { ref: listing.ref, from: listing.origin.city, to: listing.destination.city })
    : tpl(d.detail.waTruck, { ref: listing.ref, type: d.vehicles[listing.type], loc: listing.location.city });
  const waHref = `https://wa.me/${links.whatsapp}?text=${encodeURIComponent(wa)}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="mp-title">
      <button type="button" aria-label={d.detail.close} tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default bg-ink/70 backdrop-blur-sm" />
      <div className="relative flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-page shadow-lift sm:max-h-[92dvh] sm:rounded-3xl">
        <header className="flex items-start gap-3 border-b border-line bg-surface px-5 py-4 sm:px-7">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip tone={isLoad ? "dark" : "gold"}>{isLoad ? d.kind.load : d.kind.truck}</StatusChip>
              <span className="text-sm font-semibold text-muted">{listing.ref}</span>
              {isLoad && listing.urgent && <StatusChip tone="danger">{d.status.urgent}</StatusChip>}
              <span className="text-sm text-muted">{posted(d, listing.postedHoursAgo)}</span>
            </div>
            <h2 id="mp-title" className="mt-1.5 text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={d.detail.close} className="grid h-11 w-11 flex-none place-items-center rounded-full border border-line bg-surface transition hover:bg-soft">
            <IconClose className="h-5 w-5" />
          </button>
        </header>

        <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
          <p className="mb-5 flex items-center gap-2 rounded-xl bg-soft px-3.5 py-2.5 text-sm font-medium text-muted">
            <IconInfo className="h-4 w-4 flex-none" /> {d.detail.sampleNote}
          </p>
          {isLoad
            ? <LoadBody l={listing} d={d} locale={locale} base={base} onSelect={onSelect} />
            : <TruckBody t={listing} d={d} locale={locale} base={base} onSelect={onSelect} />}
        </div>

        <footer className="border-t border-line bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
          <p className="mb-3 hidden text-sm text-muted sm:block"><b className="text-fg">{d.detail.guestTitle}.</b> {isLoad ? d.detail.guestLoad : d.detail.guestTruck}</p>
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
            <Link href={links.login} className="btn btn-gold btn-sm col-span-2 sm:col-auto">{isLoad ? d.detail.quote : d.detail.request}</Link>
            <Link href={links.register} className="btn btn-outline btn-sm !px-3 sm:!px-5">{d.detail.register}</Link>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm !px-3 sm:!px-5">
              <IconChat className="h-4 w-4" /> {d.detail.whatsapp}
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
