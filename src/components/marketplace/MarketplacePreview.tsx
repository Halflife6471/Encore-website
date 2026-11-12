"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import type { Listing, Tier } from "@/lib/marketplace";
import { href } from "@/lib/routes";
import { CONTACT } from "@/lib/site";
import { IconArrow, Section, SectionHead } from "../ui";
import { LoadCard, TruckCard } from "./Cards";
import { ListingDetail } from "./ListingDetail";

const FEATURED_LOADS = ["EN-L-2041", "EN-L-2049", "EN-L-2053"];
const FEATURED_TRUCKS = ["EN-T-1108", "EN-T-1110", "EN-T-1112"];
/** Featured refs first; if they are not in the data (e.g. real listings replaced the samples), fall back to the newest three of that kind. */
function pick(all: Listing[], kind: "load" | "truck", refs: string[]): Listing[] {
  const featured = refs.map((r) => all.find((l) => l.ref === r)).filter((l): l is Listing => !!l);
  return featured.length === 3 ? featured : all.filter((l) => l.kind === kind).slice(0, 3);
}

/** Homepage teaser: three sample loads and three sample trucks, opening the same detail view as /marketplace. */
export function MarketplacePreview({ locale, d, base, listings, tier }: { locale: Locale; d: Dict; base: number; listings: Listing[]; tier: Tier }) {
  const m = d.marketplace;
  const h = d.home.marketplace;
  const [tab, setTab] = useState<"loads" | "trucks">("loads");
  const [open, setOpen] = useState<string | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const items = tab === "loads" ? pick(listings, "load", FEATURED_LOADS) : pick(listings, "truck", FEATURED_TRUCKS);
  const selected = open ? listings.find((l) => l.ref === open) : undefined;
  const all = href(locale, "marketplace");

  const tabBtn = (key: "loads" | "trucks", label: string) => (
    <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
      className={`rounded-full px-6 py-3 text-[15px] font-semibold transition ${tab === key ? "bg-fg text-page shadow-soft" : "text-muted hover:bg-soft hover:text-fg"}`}>
      {label}
    </button>
  );

  return (
    <Section tint>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead eyebrow={h.eyebrow} title={h.title} lead={h.text} />
        <div role="tablist" aria-label={h.eyebrow} className="mb-10 flex gap-1 rounded-full border border-line bg-surface p-1.5">
          {tabBtn("loads", h.loads)}
          {tabBtn("trucks", h.trucks)}
        </div>
      </div>

      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((l) => (
          <li key={l.ref}>
            {l.kind === "load"
              ? <LoadCard l={l} d={m} locale={locale} base={base} onOpen={setOpen} />
              : <TruckCard t={l} d={m} locale={locale} base={base} onOpen={setOpen} />}
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link href={all} className="btn btn-gold">{h.cta} <IconArrow className="h-5 w-5" /></Link>
        <p className="text-sm text-muted">{h.note}</p>
      </div>

      {selected && (
        <ListingDetail listing={selected} listings={listings} d={m} locale={locale} base={base} tier={tier} links={{ login: href(locale, "login"), register: href(locale, "register"), app: href(locale, "app"), whatsapp: CONTACT.whatsapp }} onClose={close} onSelect={setOpen} />
      )}
    </Section>
  );
}
