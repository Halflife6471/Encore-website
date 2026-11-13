"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { postLoadAction } from "@/lib/actions/listings";
import { defaultRequirements, suggestVehicles } from "@/lib/listing-rules";
import { addDays } from "@/lib/listing-validation";
import { CARGO_TYPE_LIST, DOC_LIST, FEATURE_LIST, PACKAGING_LIST, SECTOR_LIST, VEHICLE_LIST, type CargoType, type Country, type Packaging, type VehicleType } from "@/lib/marketplace";
import { citiesIn, corridorFor, destinationsFor, estimateRoute, bordersFor, COUNTRY_CODES } from "@/lib/places";
import { FormBanner } from "../forms/fields";
import { ChoiceCards, CheckGroup, Group, Hint, Panel, SelectInput, StepNav, Stepper, SummaryRow, TextArea, TextInput, Toggle } from "./kit";

const STEP_OF: Record<string, number> = {
  originCC: 0, originCity: 0, originAddress: 0, destCC: 0, destCity: 0, destAddress: 0, distanceKm: 0, pickupFrom: 0, pickupTo: 0, deliverBy: 0,
  commodity: 1, cargoType: 1, packaging: 1, weightT: 1, volumeCbm: 1, piece: 1, hazmatClass: 1, tempMin: 1, tempMax: 1,
  vehicleType: 2, trucksNeeded: 2, reqs: 2, docs: 2,
  budgetMin: 3, budgetMax: 3, companyName: 3, contactName: 3, contactPhone: 3, contactEmail: 3, declaredValue: 3,
  terms: 4,
};

type Defaults = { company: string; contactName: string; phone: string; email: string; today: string };
const tpl = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

export function PostLoadForm({ locale, d, defaults }: { locale: Locale; d: Dict; defaults: Defaults }) {
  const L = d.listings;
  const M = d.marketplace;
  const [state, action, pending] = useActionState(postLoadAction, {});
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const total = L.load.steps.length;

  // ---- route
  const [originCC, setOriginCC] = useState<Country>("TZ");
  const [destCC, setDestCC] = useState<Country>("ZM");
  const [originCity, setOriginCity] = useState("");
  const [destCity, setDestCity] = useState("");
  const [pickupFrom, setPickupFrom] = useState("");
  const [pickupTo, setPickupTo] = useState("");

  // ---- cargo
  const [cargoType, setCargoType] = useState<CargoType | "">("");
  const [packaging, setPackaging] = useState<Packaging | "">("");
  const [hazardous, setHazardous] = useState(false);
  const [temp, setTemp] = useState(false);
  const [weight, setWeight] = useState("");

  // ---- vehicle
  const [vehicle, setVehicle] = useState<VehicleType | "">("");
  const [trucks, setTrucks] = useState("1");
  const [reqs, setReqs] = useState<string[]>(["gps", "pod_photos", "insurance"]);
  const [docs, setDocs] = useState<string[]>(["commercial_invoice", "packing_list"]);

  // ---- price
  const [quoteOnly, setQuoteOnly] = useState(false);

  const [snap, setSnap] = useState<FormData | null>(null);

  const errors = state.fieldErrors ?? {};
  const err = (k: string) => (errors[k] ? (L.errors as Record<string, string>)[errors[k]] ?? L.errors.generic : undefined);

  // The server is the authority: if it rejects something, jump to the first step that has a problem.
  useEffect(() => {
    const keys = Object.keys(state.fieldErrors ?? {});
    if (!keys.length) return;
    const first = Math.min(...keys.map((k) => STEP_OF[k] ?? 0));
    setStep(first);
    window.scrollTo({ top: formRef.current?.offsetTop ? formRef.current.offsetTop - 90 : 0, behavior: "smooth" });
  }, [state]);

  const est = estimateRoute(originCity, originCC, destCity, destCC);
  const sameCountryPlace = originCity && destCity && originCC === destCC && originCity.trim().toLowerCase() === destCity.trim().toLowerCase();
  const unknownCity = !!originCity.trim() && !!destCity.trim() && !est && !sameCountryPlace && !!corridorFor(originCC, destCC);
  const borders = bordersFor(originCC, destCC);

  const destOptions = destinationsFor(originCC);
  const onOrigin = (cc: string) => {
    const o = cc as Country;
    setOriginCC(o);
    const dests = destinationsFor(o);
    if (!dests.includes(destCC)) setDestCC(dests.find((x) => x !== o) ?? dests[0]);
  };

  const suggestions = suggestVehicles(cargoType, packaging, { temp, hazardous });
  const perTruck = Number(weight) > 0 && Number(trucks) > 0 ? Math.round((Number(weight) / Number(trucks)) * 10) / 10 : 0;
  const crossBorder = corridorFor(originCC, destCC) !== "domestic";

  const addReqs = (more: string[]) => setReqs((cur) => [...new Set([...cur, ...more])]);
  const pickVehicle = (v: string) => {
    setVehicle(v as VehicleType);
    addReqs(defaultRequirements(v as VehicleType, { hazardous, temp, crossBorder }));
  };
  const onTemp = (on: boolean) => {
    setTemp(on);
    if (on) pickVehicle("reefer");
  };
  const onHazard = (on: boolean) => {
    setHazardous(on);
    if (on) addReqs(["hazmat", "insurance", "vetted_driver"]);
  };

  // ---- navigation with native per-step validation
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const goto = (i: number) => {
    setStep(i);
    window.scrollTo({ top: formRef.current?.offsetTop ? formRef.current.offsetTop - 90 : 0, behavior: "smooth" });
  };
  const next = () => {
    const root = panels.current[step];
    const fields = root?.querySelectorAll<HTMLInputElement>("input,select,textarea") ?? [];
    for (const el of fields) {
      if (!el.checkValidity()) { el.reportValidity(); return; }
    }
    if (step + 1 === total - 1 && formRef.current) setSnap(new FormData(formRef.current));
    goto(step + 1);
  };
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const root = panels.current[total - 1];
    const terms = root?.querySelector<HTMLInputElement>("input[name=terms]");
    if (terms && !terms.checkValidity()) { terms.reportValidity(); return; }
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  const dateMinTo = pickupFrom || defaults.today;
  const dateMinDeliver = pickupTo || pickupFrom || defaults.today;
  const countryOptions = (list: readonly string[]) => list.map((c) => ({ value: c, label: M.countries[c as Country] }));
  const v = (k: string) => String(snap?.get(k) ?? "");
  const word = (map: Record<string, string>, k: string) => map[k] ?? k;

  return (
    <form ref={formRef} onSubmit={submit} noValidate={false} className="mx-auto max-w-3xl" aria-label={L.load.title}>
      <input type="hidden" name="locale" value={locale} />
      <Stepper steps={L.load.steps as unknown as string[]} current={step} label={tpl(L.common.step, { n: step + 1, t: total })} onJump={goto} />
      {state.error && <FormBanner message={(L.errors as Record<string, string>)[state.error] ?? L.errors.generic} />}
      {!state.error && Object.keys(errors).length > 0 && <FormBanner message={L.common.fixErrors} />}

      {/* ------------------------------------------------------- 1. route */}
      <div ref={(el) => { panels.current[0] = el; }}>
        <Panel show={step === 0} title={L.load.route.title}>
          <Group title={L.load.route.from}>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectInput label={L.load.route.country} name="originCC" value={originCC} onChange={onOrigin} options={countryOptions(COUNTRY_CODES)} requiredMark error={err("originCC")} />
              <TextInput label={L.load.route.city} name="originCity" value={originCity} onChange={(e) => setOriginCity(e.target.value)} list="cities-origin" placeholder={L.load.route.cityPh} autoComplete="off" requiredMark error={err("originCity")} />
            </div>
            <datalist id="cities-origin">{citiesIn(originCC).map((c) => <option key={c} value={c} />)}</datalist>
            <TextInput label={L.load.route.address} name="originAddress" optionalText={L.common.optional} hint={L.load.route.addressHelp} maxLength={160} error={err("originAddress")} />
          </Group>

          <Group title={L.load.route.to}>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectInput label={L.load.route.country} name="destCC" value={destCC} onChange={(x) => setDestCC(x as Country)} options={countryOptions(destOptions)} requiredMark error={err("destCC")} />
              <TextInput label={L.load.route.city} name="destCity" value={destCity} onChange={(e) => setDestCity(e.target.value)} list="cities-dest" placeholder={L.load.route.cityPh} autoComplete="off" requiredMark error={err("destCity")} />
            </div>
            <datalist id="cities-dest">{citiesIn(destCC).map((c) => <option key={c} value={c} />)}</datalist>
            <TextInput label={L.load.route.addressDestination} name="destAddress" optionalText={L.common.optional} hint={L.load.route.addressHelp} maxLength={160} error={err("destAddress")} />
            <p className="text-[13px] text-muted">{L.load.route.cityHelp}</p>
          </Group>

          {est && (
            <Hint tone="ok">
              {tpl(L.load.route.estimate, { km: est.km.toLocaleString("en-US"), a: est.transit[0], b: est.transit[1] })}{" "}
              {borders.length ? tpl(L.load.route.borders, { list: borders.join(", ") }) : L.load.route.noBorders}
            </Hint>
          )}
          {unknownCity && (
            <TextInput label={L.load.route.distance} name="distanceKm" type="number" inputMode="numeric" min={5} max={6000} hint={L.load.route.distanceHelp} requiredMark error={err("distanceKm")} />
          )}
          {!est && !unknownCity && errors.distanceKm && <p className="text-[13px] font-medium text-danger">{err("distanceKm")}</p>}

          <Group title={L.load.route.datesTitle} help={L.load.route.pickupHelp}>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextInput label={L.load.route.pickupFrom} name="pickupFrom" type="date" min={defaults.today} max={addDays(defaults.today, 180)} value={pickupFrom} onChange={(e) => setPickupFrom(e.target.value)} requiredMark error={err("pickupFrom")} />
              <TextInput label={L.load.route.pickupTo} name="pickupTo" type="date" min={dateMinTo} value={pickupTo} onChange={(e) => setPickupTo(e.target.value)} requiredMark error={err("pickupTo")} />
              <TextInput label={L.load.route.deliverBy} name="deliverBy" type="date" min={dateMinDeliver} requiredMark error={err("deliverBy")} />
            </div>
            <UrgentToggle title={L.load.route.urgent} help={L.load.route.urgentHelp} />
          </Group>
        </Panel>
      </div>

      {/* ------------------------------------------------------- 2. cargo */}
      <div ref={(el) => { panels.current[1] = el; }}>
        <Panel show={step === 1} title={L.load.cargo.title}>
          <Group title={L.load.cargo.commodity}>
            <TextInput label={L.load.cargo.commodity} name="commodity" placeholder={L.load.cargo.commodityPh} maxLength={120} requiredMark error={err("commodity")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectInput label={L.load.cargo.type} name="cargoType" value={cargoType} onChange={(x) => setCargoType(x as CargoType)} placeholder={L.common.selectPlaceholder} options={CARGO_TYPE_LIST.map((c) => ({ value: c, label: M.cargoTypes[c] }))} requiredMark error={err("cargoType")} />
              <SelectInput label={L.load.cargo.packaging} name="packaging" value={packaging} onChange={(x) => setPackaging(x as Packaging)} placeholder={L.common.selectPlaceholder} options={PACKAGING_LIST.map((c) => ({ value: c, label: M.packaging[c] }))} requiredMark error={err("packaging")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label={L.load.cargo.weight} name="weightT" type="number" inputMode="decimal" step="0.1" min={0.1} max={1000} value={weight} onChange={(e) => setWeight(e.target.value)} hint={L.load.cargo.weightHelp} requiredMark error={err("weightT")} />
              <TextInput label={L.load.cargo.volume} name="volumeCbm" type="number" inputMode="decimal" step="0.1" min={0.1} optionalText={L.common.optional} error={err("volumeCbm")} />
            </div>
            {(packaging === "oversize" || cargoType === "heavy") && (
              <TextInput label={L.load.cargo.piece} name="piece" placeholder={L.load.cargo.piecePh} hint={L.load.cargo.pieceHelp} maxLength={40} requiredMark error={err("piece")} />
            )}
          </Group>

          <Group title={`${L.load.cargo.hazardous} / ${L.load.cargo.temp}`}>
            <Toggle name="hazardous" title={L.load.cargo.hazardous} help={L.load.cargo.hazardousHelp} checked={hazardous} onChange={onHazard} />
            {hazardous && <TextInput label={L.load.cargo.hazmatClass} name="hazmatClass" placeholder={L.load.cargo.hazmatPh} maxLength={60} requiredMark error={err("hazmatClass")} />}
            <Toggle name="tempControlled" title={L.load.cargo.temp} help={L.load.cargo.tempHelp} checked={temp} onChange={onTemp} />
            {temp && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label={L.load.cargo.tempMin} name="tempMin" type="number" inputMode="decimal" step="0.5" min={-40} max={40} requiredMark error={err("tempMin")} />
                <TextInput label={L.load.cargo.tempMax} name="tempMax" type="number" inputMode="decimal" step="0.5" min={-40} max={40} requiredMark error={err("tempMax")} />
              </div>
            )}
          </Group>

          <Group title={L.load.cargo.note}>
            <SelectInput label={L.load.cargo.sector} name="sector" defaultValue="trading" options={SECTOR_LIST.map((s) => ({ value: s, label: M.sectors[s] }))} />
            <TextArea label={L.load.cargo.note} name="note" placeholder={L.load.cargo.notePh} hint={L.load.cargo.noteHelp} maxLength={400} optionalText={L.common.optional} />
          </Group>
        </Panel>
      </div>

      {/* ----------------------------------------------------- 3. vehicle */}
      <div ref={(el) => { panels.current[2] = el; }}>
        <Panel show={step === 2} title={L.load.vehicle.title}>
          <Group title={L.load.vehicle.type}>
            {suggestions.length > 0 && (
              <Hint tone="ok">
                ★ {L.load.vehicle.suggested}:{" "}
                {suggestions.map((s, i) => (
                  <button key={s} type="button" onClick={() => pickVehicle(s)} className="mr-2 font-semibold underline decoration-gold decoration-2 underline-offset-4">{M.vehicles[s]}{i < suggestions.length - 1 ? "," : ""}</button>
                ))}
              </Hint>
            )}
            <ChoiceCards
              name="vehicleType"
              value={vehicle}
              onChange={pickVehicle}
              suggested={suggestions}
              error={err("vehicleType")}
              options={VEHICLE_LIST.map((x) => ({ value: x, label: M.vehicles[x], hint: L.vehicleHints[x] }))}
            />
            <TextInput label={L.load.vehicle.trucks} name="trucksNeeded" type="number" inputMode="numeric" min={1} max={50} value={trucks} onChange={(e) => setTrucks(e.target.value)} hint={perTruck && Number(trucks) > 1 ? tpl(L.load.vehicle.trucksHelp, { w: perTruck }) : undefined} requiredMark error={err("trucksNeeded")} />
          </Group>
          <Group title={L.load.vehicle.requirements} help={L.load.vehicle.requirementsHelp}>
            <CheckGroup name="reqs" values={reqs} onChange={setReqs} options={FEATURE_LIST.map((f) => ({ value: f, label: M.features[f] }))} />
          </Group>
          <Group title={L.load.vehicle.docs} help={L.load.vehicle.docsHelp}>
            <CheckGroup name="docs" values={docs} onChange={setDocs} options={DOC_LIST.map((x) => ({ value: x, label: M.docs[x] }))} />
          </Group>
        </Panel>
      </div>

      {/* ------------------------------------------------- 4. price + contact */}
      <div ref={(el) => { panels.current[3] = el; }}>
        <Panel show={step === 3} title={L.load.price.title}>
          <Group title={L.load.price.budgetTitle}>
            <Toggle name="quoteOnly" title={L.load.price.quoteOnly} help={L.load.price.quoteOnlyHelp} checked={quoteOnly} onChange={setQuoteOnly} />
            {!quoteOnly && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label={L.load.price.min} name="budgetMin" type="number" inputMode="numeric" min={50} step="50" requiredMark error={err("budgetMin")} />
                <TextInput label={L.load.price.max} name="budgetMax" type="number" inputMode="numeric" min={50} step="50" requiredMark error={err("budgetMax")} />
              </div>
            )}
            {!quoteOnly && <p className="text-[13px] text-muted">{L.load.price.budgetHelp}</p>}
          </Group>
          <Group title={L.load.price.contactTitle} help={L.load.price.contactIntro}>
            <TextInput label={L.load.price.company} name="companyName" defaultValue={defaults.company} maxLength={120} requiredMark error={err("companyName")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label={L.load.price.contactName} name="contactName" defaultValue={defaults.contactName} autoComplete="name" requiredMark error={err("contactName")} />
              <TextInput label={L.load.price.phone} name="contactPhone" type="tel" inputMode="tel" defaultValue={defaults.phone} autoComplete="tel" placeholder="+255 712 345 678" requiredMark error={err("contactPhone")} />
            </div>
            <TextInput label={L.load.price.email} name="contactEmail" type="email" inputMode="email" defaultValue={defaults.email} autoComplete="email" requiredMark error={err("contactEmail")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label={L.load.price.declared} name="declaredValue" type="number" inputMode="numeric" min={0} hint={L.load.price.declaredHelp} optionalText={L.common.optional} error={err("declaredValue")} />
              <TextArea label={L.load.price.privateNotes} name="privateNotes" placeholder={L.load.price.privateNotesPh} maxLength={500} rows={2} optionalText={L.common.optional} />
            </div>
          </Group>
        </Panel>
      </div>

      {/* ------------------------------------------------------ 5. review */}
      <div ref={(el) => { panels.current[4] = el; }}>
        <Panel show={step === 4} title={L.load.review.title} lead={L.load.review.intro}>
          {snap && (
            <div className="rounded-3xl border border-line bg-surface px-5 py-2 sm:px-6">
              <SummaryRow k={L.load.review.route} onEdit={() => goto(0)} editLabel={L.common.edit}>
                {v("originCity")}, {M.countries[v("originCC") as Country]} → {v("destCity")}, {M.countries[v("destCC") as Country]}
                {est && <span className="block text-sm font-normal text-muted">{tpl(L.load.route.estimate, { km: est.km.toLocaleString("en-US"), a: est.transit[0], b: est.transit[1] })}</span>}
                {!est && v("distanceKm") && <span className="block text-sm font-normal text-muted">≈ {v("distanceKm")} km</span>}
              </SummaryRow>
              <SummaryRow k={L.load.review.dates} onEdit={() => goto(0)} editLabel={L.common.edit}>
                {v("pickupFrom")} → {v("pickupTo")} · {L.load.route.deliverBy.toLowerCase()} {v("deliverBy")}
                {v("urgent") && <span className="chip ml-2 bg-gold text-ongold">{L.load.review.yesUrgent}</span>}
              </SummaryRow>
              <SummaryRow k={L.load.review.cargo} onEdit={() => goto(1)} editLabel={L.common.edit}>
                {v("commodity")}
                <span className="block text-sm font-normal text-muted">
                  {word(M.cargoTypes, v("cargoType"))} · {word(M.packaging, v("packaging"))} · {v("weightT")} t{v("hazardous") ? ` · ${v("hazmatClass")}` : ""}{v("tempControlled") ? ` · ${v("tempMin")}–${v("tempMax")} °C` : ""}
                </span>
              </SummaryRow>
              <SummaryRow k={L.load.review.vehicle} onEdit={() => goto(2)} editLabel={L.common.edit}>
                {v("trucksNeeded")} × {word(M.vehicles, v("vehicleType"))}
                <span className="block text-sm font-normal text-muted">{snap.getAll("reqs").map((r) => word(M.features, String(r))).join(" · ")}</span>
              </SummaryRow>
              <SummaryRow k={L.load.review.budget} onEdit={() => goto(3)} editLabel={L.common.edit}>
                {v("quoteOnly") ? L.load.review.quotes : `USD ${Number(v("budgetMin")).toLocaleString("en-US")} – ${Number(v("budgetMax")).toLocaleString("en-US")} ${L.load.review.perTruck}`}
              </SummaryRow>
              <SummaryRow k={L.load.review.contact} onEdit={() => goto(3)} editLabel={L.common.edit}>
                {v("contactName")} · {v("companyName")}
                <span className="block text-sm font-normal text-muted">{v("contactPhone")} · {v("contactEmail")}</span>
              </SummaryRow>
            </div>
          )}
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-[15px] leading-snug">
            <input type="checkbox" name="terms" required className="mt-0.5 h-5 w-5 flex-none rounded-md border-g2 accent-gold" aria-invalid={!!errors.terms} />
            <span>{L.load.review.terms}</span>
          </label>
          {errors.terms && <p className="text-[13px] font-medium text-danger" role="alert">{err("terms")}</p>}
          <Hint>{L.load.review.afterSubmit}</Hint>
        </Panel>
      </div>

      <StepNav step={step} total={total} back={L.common.back} next={L.common.next} submit={L.common.submit} submitting={L.common.submitting} pending={pending} onBack={() => goto(step - 1)} onNext={next} />
    </form>
  );
}

/** Small self-contained toggle so the urgent switch does not need page-level state. */
function UrgentToggle({ title, help }: { title: string; help: string }) {
  const [on, setOn] = useState(false);
  return <Toggle name="urgent" title={title} help={help} checked={on} onChange={setOn} />;
}
