"use client";

import { useCallback, useMemo, useState } from "react";
import { LISTINGS, perTruckT, type Corridor, type Listing, type VehicleType } from "@/lib/marketplace";
import type { Locale } from "@/lib/i18n-config";
import { LoadCard, TruckCard } from "./Cards";
import { ListingDetail } from "./ListingDetail";
import { IconFilter, IconSearch } from "./icons";
import { tpl, type MP } from "./fmt";

type Tab = "all" | "load" | "truck";
type Sort = "newest" | "soonest" | "heaviest";
type Weight = "any" | "w1" | "w2" | "w3";

const CORRIDORS: Corridor[] = ["tz-zm", "tz-cd", "tz-mw", "tz-rw-bi", "northern", "tz-ke", "domestic"];
const VEHICLES: VehicleType[] = ["flatbed", "curtainside", "container", "tipper", "fuel_tanker", "chem_tanker", "reefer", "box", "lowbed", "bulk"];

const weightOf = (l: Listing) => (l.kind === "load" ? perTruckT(l) : l.payloadT);
const vehicleOf = (l: Listing) => (l.kind === "load" ? l.truckType : l.type);
const soonOf = (l: Listing) => (l.kind === "load" ? l.pickup[0] : l.availIn);

export function MarketplaceBrowser({
  d, locale, base, links,
}: {
  d: MP; locale: Locale; base: number; links: { login: string; register: string; whatsapp: string };
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [corridor, setCorridor] = useState<Corridor | "">("");
  const [vehicle, setVehicle] = useState<VehicleType | "">("");
  const [weight, setWeight] = useState<Weight>("any");
  const [sort, setSort] = useState<Sort>("newest");
  const [open, setOpen] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const counts = useMemo(
    () => ({ all: LISTINGS.length, load: LISTINGS.filter((l) => l.kind === "load").length, truck: LISTINGS.filter((l) => l.kind === "truck").length }),
    [],
  );

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const hay = (l: Listing) =>
      (l.kind === "load"
        ? [l.ref, l.origin.city, l.destination.city, l.commodity.en, l.commodity.sw, d.cargoTypes[l.cargoType], d.vehicles[l.truckType]]
        : [l.ref, l.make, l.location.city, l.transporter.ref, d.vehicles[l.type]]
      ).join(" ").toLowerCase();

    const list = LISTINGS.filter((l) => {
      if (tab !== "all" && l.kind !== tab) return false;
      if (needle && !hay(l).includes(needle)) return false;
      if (corridor && !(l.kind === "load" ? l.corridor === corridor : l.routes.includes(corridor))) return false;
      if (vehicle && vehicleOf(l) !== vehicle) return false;
      if (weight !== "any") {
        const w = weightOf(l);
        if (weight === "w1" && w > 15) return false;
        if (weight === "w2" && (w <= 15 || w > 30)) return false;
        if (weight === "w3" && w <= 30) return false;
      }
      return true;
    });
    const cmp: Record<Sort, (a: Listing, b: Listing) => number> = {
      newest: (a, b) => a.postedHoursAgo - b.postedHoursAgo,
      soonest: (a, b) => soonOf(a) - soonOf(b) || a.postedHoursAgo - b.postedHoursAgo,
      heaviest: (a, b) => weightOf(b) - weightOf(a),
    };
    return [...list].sort(cmp[sort]);
  }, [tab, q, corridor, vehicle, weight, sort, d]);

  const active = (corridor ? 1 : 0) + (vehicle ? 1 : 0) + (weight !== "any" ? 1 : 0) + (q ? 1 : 0);
  const reset = () => { setQ(""); setCorridor(""); setVehicle(""); setWeight("any"); };
  const close = useCallback(() => setOpen(null), []);
  const selected = open ? LISTINGS.find((l) => l.ref === open) : undefined;

  const tabBtn = (key: Tab, label: string, n: number) => (
    <button
      key={key}
      type="button"
      role="tab"
      aria-selected={tab === key}
      onClick={() => setTab(key)}
      className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-[15px] font-semibold transition ${tab === key ? "bg-fg text-page shadow-soft" : "text-muted hover:bg-soft hover:text-fg"}`}
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tab === key ? "bg-gold text-ongold" : "bg-line text-fg"}`}>{n}</span>
    </button>
  );

  const select = "input !h-12 !rounded-xl !text-[15px]";

  return (
    <div>
      {/* Tabs + search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label={d.eyebrow} className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1.5">
          {tabBtn("all", d.tabs.all, counts.all)}
          {tabBtn("load", d.tabs.loads, counts.load)}
          {tabBtn("truck", d.tabs.trucks, counts.truck)}
        </div>
        <div className="flex gap-2 lg:w-[28rem]">
          <label className="relative flex-1">
            <span className="sr-only">{d.searchLabel}</span>
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.searchPh} className="input !h-12 !rounded-full !pl-12 !text-[15px]" />
          </label>
          <button type="button" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} className="btn btn-outline btn-sm !px-4 lg:hidden">
            <IconFilter className="h-4 w-4" /> {d.filters.show}{active > 0 && ` (${active})`}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`${filtersOpen ? "grid" : "hidden"} mt-4 gap-3 rounded-3xl border border-line bg-surface p-4 sm:grid-cols-2 lg:mt-5 lg:grid lg:grid-cols-4`}>
        <label className="block">
          <span className="label !text-[13px]">{d.filters.corridor}</span>
          <select value={corridor} onChange={(e) => setCorridor(e.target.value as Corridor | "")} className={select}>
            <option value="">{d.filters.allCorridors}</option>
            {CORRIDORS.map((c) => <option key={c} value={c}>{d.corridors[c]}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label !text-[13px]">{d.filters.vehicle}</span>
          <select value={vehicle} onChange={(e) => setVehicle(e.target.value as VehicleType | "")} className={select}>
            <option value="">{d.filters.allVehicles}</option>
            {VEHICLES.map((v) => <option key={v} value={v}>{d.vehicles[v]}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label !text-[13px]">{d.filters.weight}</span>
          <select value={weight} onChange={(e) => setWeight(e.target.value as Weight)} className={select}>
            <option value="any">{d.filters.anyWeight}</option>
            <option value="w1">{d.filters.w1}</option>
            <option value="w2">{d.filters.w2}</option>
            <option value="w3">{d.filters.w3}</option>
          </select>
        </label>
        <label className="block">
          <span className="label !text-[13px]">{d.filters.sort}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={select}>
            <option value="newest">{d.filters.newest}</option>
            <option value="soonest">{d.filters.soonest}</option>
            <option value="heaviest">{d.filters.heaviest}</option>
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted" aria-live="polite">
        <p>{tpl(d.showing, { n: results.length, t: counts.all })}</p>
        {active > 0 && <button type="button" onClick={reset} className="link-gold text-fg">{d.filters.reset}</button>}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="card mt-6 text-center">
          <p className="text-xl font-bold">{d.empty.t}</p>
          <p className="mt-2 text-muted">{d.empty.d}</p>
          <button type="button" onClick={reset} className="btn btn-gold btn-sm mt-5">{d.filters.reset}</button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-6 lg:grid-cols-2">
          {results.map((l) => (
            <li key={l.ref}>
              {l.kind === "load"
                ? <LoadCard l={l} d={d} locale={locale} base={base} onOpen={setOpen} />
                : <TruckCard t={l} d={d} locale={locale} base={base} onOpen={setOpen} />}
            </li>
          ))}
        </ul>
      )}

      {selected && <ListingDetail listing={selected} d={d} locale={locale} base={base} links={links} onClose={close} onSelect={setOpen} />}
    </div>
  );
}
