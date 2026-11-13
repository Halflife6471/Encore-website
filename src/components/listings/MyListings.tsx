import Link from "next/link";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { closeListingAction } from "@/lib/actions/listings";
import type { Country, VehicleType } from "@/lib/marketplace";
import { appPath, href } from "@/lib/routes";
import { StatusChip } from "../ui";

export type LoadRow = {
  id: string; reference: string; status: string; origin_city: string; origin_country: string; destination_city: string; destination_country: string;
  weight_t: number; vehicle_type: string; rejected_reason: string | null;
};
export type TruckRow = {
  id: string; reference: string; status: string; vehicle_type: string; make_model: string; year: number; payload_t: number;
  location_city: string; location_country: string; rejected_reason: string | null; truck_documents: { count: number }[] | null;
};

const tone = (s: string) => (s === "published" ? "dark" : s === "pending_review" ? "gold" : s === "rejected" ? "danger" : "grey");
const tpl = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
const CAN_WITHDRAW = ["draft", "pending_review", "published", "rejected"];

function Withdraw({ locale, d, kind, id }: { locale: Locale; d: Dict; kind: "load" | "truck"; id: string }) {
  return (
    <form action={closeListingAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <button type="submit" title={d.listings.my.withdrawHint} className="btn btn-outline btn-sm">{d.listings.my.withdraw}</button>
    </form>
  );
}

function StatusLine({ d, status, reason }: { d: Dict; status: string; reason: string | null }) {
  const my = d.listings.my;
  const s = status as keyof typeof my.statuses;
  return (
    <>
      <StatusChip tone={tone(status)}>{my.statuses[s] ?? status}</StatusChip>
      <p className="mt-1.5 text-[13px] text-muted">{my.help[s] ?? ""}{status === "rejected" && reason ? ` ${my.reason}: ${reason}` : ""}</p>
    </>
  );
}

export function MyLoads({ locale, d, rows }: { locale: Locale; d: Dict; rows: LoadRow[] }) {
  const my = d.listings.my;
  const M = d.marketplace;
  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{my.cargoTitle}</h2>
        <Link href={appPath(locale, "post-load")} className="btn btn-gold btn-sm">{my.post}</Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-soft p-4 text-muted">{my.cargoEmpty}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{tpl(my.trip, { from: r.origin_city, to: r.destination_city })}</p>
                <p className="text-sm text-muted">
                  {r.reference} · {tpl(my.tons, { n: r.weight_t })} · {M.vehicles[r.vehicle_type as VehicleType] ?? r.vehicle_type} · {M.countries[r.origin_country as Country]} → {M.countries[r.destination_country as Country]}
                </p>
                <div className="mt-2"><StatusLine d={d} status={r.status} reason={r.rejected_reason} /></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.status === "published" && <Link href={href(locale, "marketplace")} className="btn btn-outline btn-sm">{my.viewMarketplace}</Link>}
                {CAN_WITHDRAW.includes(r.status) && <Withdraw locale={locale} d={d} kind="load" id={r.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MyTrucks({ locale, d, rows }: { locale: Locale; d: Dict; rows: TruckRow[] }) {
  const my = d.listings.my;
  const M = d.marketplace;
  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{my.trucksTitle}</h2>
        <Link href={appPath(locale, "register-truck")} className="btn btn-gold btn-sm">{my.register}</Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-soft p-4 text-muted">{my.trucksEmpty}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {rows.map((r) => {
            const docCount = r.truck_documents?.[0]?.count ?? 0;
            return (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{M.vehicles[r.vehicle_type as VehicleType] ?? r.vehicle_type} · {r.make_model}</p>
                  <p className="text-sm text-muted">
                    {r.reference} · {r.year} · {tpl(my.tons, { n: r.payload_t })} · {r.location_city}, {M.countries[r.location_country as Country]} · {my.documents}: {tpl(my.docCount, { n: docCount })}
                  </p>
                  <div className="mt-2"><StatusLine d={d} status={r.status} reason={r.rejected_reason} /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={appPath(locale, `trucks/${r.id}`)} className="btn btn-outline btn-sm">{my.addDocuments}</Link>
                  {r.status === "published" && <Link href={href(locale, "marketplace")} className="btn btn-outline btn-sm">{my.viewMarketplace}</Link>}
                  {CAN_WITHDRAW.includes(r.status) && <Withdraw locale={locale} d={d} kind="truck" id={r.id} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
