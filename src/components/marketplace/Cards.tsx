import type { ReactNode } from "react";
import { perTruckT, type Load, type Truck, type Verification } from "@/lib/marketplace";
import type { Locale } from "@/lib/i18n-config";
import { IconCheck, IconArrow, StatusChip } from "../ui";
import { IconCalendar, IconPin, IconScale, IconShield, IconStarSolid } from "./icons";
import { TruckArt } from "./TruckArt";
import { dateRange, km, makeDate, posted, tonnes, tpl, usd, type MP } from "./fmt";

type Fmt = ReturnType<typeof makeDate>;

export function VerificationChip({ v, d }: { v: Verification; d: MP }) {
  const tone = v === "verified" ? "dark" : v === "under_review" ? "gold" : "grey";
  return (
    <StatusChip tone={tone}>
      {v === "verified" && <IconCheck className="mr-1 h-3 w-3" />}
      {d.verification[v]}
    </StatusChip>
  );
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 gap-2.5">
      <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-soft text-muted [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
        <div className="text-[15px] font-medium leading-snug">{children}</div>
      </div>
    </div>
  );
}

function Tags({ items, more }: { items: string[]; more: string }) {
  const shown = items.slice(0, 3);
  const rest = items.length - shown.length;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((t) => (
        <li key={t} className="rounded-full border border-line bg-soft px-2.5 py-1 text-xs font-medium text-muted">{t}</li>
      ))}
      {rest > 0 && <li className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-muted">{tpl(more, { n: rest })}</li>}
    </ul>
  );
}

const shell = "card relative flex h-full flex-col !p-0 overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift focus-within:ring-4 focus-within:ring-gold/45";

/* ------------------------------------------------------------------ LOAD */
export function LoadCard({ l, d, locale, base, onOpen }: { l: Load; d: MP; locale: Locale; base: number; onOpen: (ref: string) => void }) {
  const fmt = makeDate(locale);
  const perTruck = perTruckT(l);
  return (
    <article className={shell} aria-labelledby={`t-${l.ref}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-soft/60 px-5 py-3">
        <StatusChip tone="dark">{d.kind.load}</StatusChip>
        <span className="text-sm font-semibold text-muted">{l.ref}</span>
        <SampleTag d={d} />
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          {l.urgent && <StatusChip tone="danger">{d.status.urgent}</StatusChip>}
          <StatusChip tone="gold">{d.status.open}</StatusChip>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div>
          <h3 id={`t-${l.ref}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xl font-bold leading-tight">
            <span>{l.origin.city} <span className="text-sm font-semibold text-muted">{l.origin.cc}</span></span>
            <IconArrow className="h-5 w-5 flex-none text-gold" />
            <span>{l.destination.city} <span className="text-sm font-semibold text-muted">{l.destination.cc}</span></span>
          </h3>
          <p className="mt-1.5 text-sm text-muted">
            {km(l.km)} · {l.transit[0]}–{l.transit[1]} {d.card.days}
            {l.borders.length > 0 && <> · {l.borders.join(" → ")}</>}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Fact icon={<IconScale />} label={d.card.cargo}>
            <span className="line-clamp-2">{l.commodity[locale]}</span>
            <span className="block text-sm font-normal text-muted">{d.packaging[l.packaging]}</span>
          </Fact></div>
          <Fact icon={<IconScale />} label={d.card.weight}>
            {tonnes(l.weightT)}
            <span className="block text-sm font-normal text-muted">
              {l.trucks > 1 ? `${tpl(d.card.trucksNeeded, { n: l.trucks })} · ${tonnes(perTruck)}` : d.card.truckNeeded}
            </span>
          </Fact>
          <Fact icon={<IconShield />} label={d.card.vehicle}>{d.vehicles[l.truckType]}</Fact>
          <Fact icon={<IconCalendar />} label={d.card.pickup}>
            {dateRange(fmt, base, l.pickup)}
            <span className="block text-sm font-normal text-muted">{d.card.deliveryBy} {fmt(base, l.deliveryBy)}</span>
          </Fact>
        </div>

        <Tags items={l.reqs.map((r) => d.features[r])} more={d.card.more} />

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-goldsoft px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{d.card.budget}</p>
            <p className="text-xl font-extrabold">USD {usd(l.budget[0])} – {usd(l.budget[1])}</p>
          </div>
          <p className="text-sm font-medium text-muted">{d.card.perTruck}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-5 py-3.5 text-sm text-muted">
        <span>{posted(d, l.postedHoursAgo)}</span>
        <span>{l.quotes > 0 ? tpl(d.card.quotes, { n: l.quotes }) : d.card.noQuotes}</span>
        <VerificationChip v={l.owner.verification} d={d} />
        <button type="button" onClick={() => onOpen(l.ref)} className="ml-auto inline-flex items-center gap-1.5 font-semibold text-fg after:absolute after:inset-0 after:content-[''] hover:underline">
          {d.card.view} <IconArrow className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

/* ----------------------------------------------------------------- TRUCK */
export function TruckCard({ t, d, locale, base, onOpen }: { t: Truck; d: MP; locale: Locale; base: number; onOpen: (ref: string) => void }) {
  const fmt: Fmt = makeDate(locale);
  const now = t.availIn === 0;
  return (
    <article className={shell} aria-labelledby={`t-${t.ref}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-soft/60 px-5 py-3">
        <StatusChip tone="gold">{d.kind.truck}</StatusChip>
        <span className="text-sm font-semibold text-muted">{t.ref}</span>
        <SampleTag d={d} />
        <span className="ml-auto">
          <StatusChip tone={now ? "dark" : "grey"}>{now ? d.status.now : tpl(d.status.soon, { n: t.availIn })}</StatusChip>
        </span>
      </div>

      <div className="bg-gradient-to-b from-soft to-surface px-6 pt-4">
        <TruckArt type={t.type} className="mx-auto h-24 w-full max-w-[280px]" />
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div>
          <h3 id={`t-${t.ref}`} className="text-xl font-bold leading-tight">{d.vehicles[t.type]}</h3>
          <p className="mt-1 text-sm text-muted">{t.make} · {t.year} · {t.axles}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Fact icon={<IconScale />} label={d.card.payload}>
            {tonnes(t.payloadT)}
            <span className="block text-sm font-normal text-muted">{t.body}</span>
          </Fact>
          <Fact icon={<IconPin />} label={d.card.location}>
            {t.location.city} <span className="text-sm font-semibold text-muted">{t.location.cc}</span>
            <span className="block text-sm font-normal text-muted">{d.card.available}: {now ? d.status.now : fmt(base, t.availIn)}</span>
          </Fact>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{d.card.routes}</p>
          <Tags items={t.routes.map((r) => d.corridors[r])} more={d.card.more} />
        </div>

        <Tags items={t.features.map((f) => d.features[f])} more={d.card.more} />

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-goldsoft px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{d.card.rate}</p>
            <p className="text-xl font-extrabold">USD {t.rate[0].toFixed(1)} – {t.rate[1].toFixed(1)}</p>
          </div>
          <p className="text-sm font-medium text-muted">{d.card.perKm}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-5 py-3.5 text-sm text-muted">
        <span className="inline-flex items-center gap-1 font-semibold text-fg">
          <IconStarSolid className="h-4 w-4 text-gold" /> {t.transporter.rating.toFixed(1)}
        </span>
        <span>{tpl(d.card.trips, { n: t.transporter.trips })}</span>
        <span>{tpl(d.card.fleet, { n: t.transporter.fleet })}</span>
        <VerificationChip v={t.transporter.verification} d={d} />
        <button type="button" onClick={() => onOpen(t.ref)} className="ml-auto inline-flex items-center gap-1.5 font-semibold text-fg after:absolute after:inset-0 after:content-[''] hover:underline">
          {d.card.view} <IconArrow className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function SampleTag({ d }: { d: MP }) {
  return (
    <span className="rounded-md border border-line px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
      {d.sampleTag}
    </span>
  );
}
