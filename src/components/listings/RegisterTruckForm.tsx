"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { registerTruckAction } from "@/lib/actions/listings";
import { AXLE_SUGGESTIONS, defaultTruckFeatures, recommendedTruckDocs } from "@/lib/listing-rules";
import { bodyKindOf, CONTAINER_CONFIGS } from "@/lib/listing-validation";
import { CORRIDOR_LIST, FEATURE_LIST, VEHICLE_LIST, type Country, type VehicleType } from "@/lib/marketplace";
import { citiesIn, COUNTRY_CODES } from "@/lib/places";
import { href } from "@/lib/routes";
import { FormBanner } from "../forms/fields";
import { IconCheck } from "../ui";
import { ChoiceCards, CheckGroup, Group, Hint, Panel, SelectInput, StepNav, Stepper, SummaryRow, TextInput, Toggle } from "./kit";
import { TruckDocuments } from "./TruckDocuments";

const STEP_OF: Record<string, number> = {
  vehicleType: 0, makeModel: 0, year: 0, axles: 0, payloadT: 0, plateNumber: 0, trailerPlate: 0,
  bodyLength: 1, bodyWidth: 1, bodyHeight: 1, containerConfig: 1, tankLitres: 1, compartments: 1, volumeM3: 1, features: 1, insuranceExpiry: 1,
  locCC: 2, locCity: 2, baseAddress: 2, availableFrom: 2, corridors: 2, rateMin: 2, rateMax: 2, contactName: 2, contactPhone: 2, contactEmail: 2,
  terms: 3,
};

type Defaults = { contactName: string; phone: string; email: string; company: string; today: string };
const tpl = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

export function RegisterTruckForm({ locale, d, defaults }: { locale: Locale; d: Dict; defaults: Defaults }) {
  const L = d.listings;
  const T = L.truck;
  const M = d.marketplace;
  const [state, action, pending] = useActionState(registerTruckAction, {});
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const total = T.steps.length;

  const [vehicle, setVehicle] = useState<VehicleType | "">("");
  const [features, setFeatures] = useState<string[]>([]);
  const [locCC, setLocCC] = useState<Country>("TZ");
  const [locCity, setLocCity] = useState("");
  const [availNow, setAvailNow] = useState(true);
  const [corridors, setCorridors] = useState<string[]>([]);
  const [snap, setSnap] = useState<FormData | null>(null);

  const errors = state.fieldErrors ?? {};
  const err = (k: string) => (errors[k] ? (L.errors as Record<string, string>)[errors[k]] ?? L.errors.generic : undefined);

  useEffect(() => {
    const keys = Object.keys(state.fieldErrors ?? {});
    if (!keys.length) return;
    setStep(Math.min(...keys.map((k) => STEP_OF[k] ?? 0)));
    window.scrollTo({ top: formRef.current?.offsetTop ? formRef.current.offsetTop - 90 : 0, behavior: "smooth" });
  }, [state]);

  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const goto = (i: number) => {
    setStep(i);
    window.scrollTo({ top: formRef.current?.offsetTop ? formRef.current.offsetTop - 90 : 0, behavior: "smooth" });
  };
  const next = () => {
    const fields = panels.current[step]?.querySelectorAll<HTMLInputElement>("input,select,textarea") ?? [];
    for (const el of fields) if (!el.checkValidity()) { el.reportValidity(); return; }
    if (step + 1 === total - 1 && formRef.current) setSnap(new FormData(formRef.current));
    goto(step + 1);
  };
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const terms = panels.current[total - 1]?.querySelector<HTMLInputElement>("input[name=terms]");
    if (terms && !terms.checkValidity()) { terms.reportValidity(); return; }
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  const pickVehicle = (v: string) => {
    const x = v as VehicleType;
    setVehicle(x);
    setFeatures((cur) => [...new Set([...cur, ...defaultTruckFeatures(x)])]);
  };

  const kind = vehicle ? bodyKindOf(vehicle) : "dimensions";
  const v = (k: string) => String(snap?.get(k) ?? "");
  const word = (map: Record<string, string>, k: string) => map[k] ?? k;

  /* ---------------------------------------------------------- success + docs */
  if (state.ok && state.extra?.truckId) {
    return (
      <div className="mx-auto max-w-3xl">
        <div role="status" className="flex flex-wrap items-center gap-4 rounded-3xl border border-goldline bg-goldsoft p-5 sm:p-6">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-gold"><IconCheck className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold">{T.done.title}</p>
            <p className="mt-1 text-muted">{tpl(T.done.text, { ref: state.reference ?? "" })} {L.my.help.pending_review}</p>
          </div>
        </div>

        <h2 className="mt-8 text-2xl font-bold">{T.done.next}</h2>
        <p className="mt-1 text-muted">{T.done.nextText}</p>
        <div className="mt-5">
          <TruckDocuments d={d} truckId={state.extra.truckId} companyId={state.extra.companyId} initial={[]} recommended={recommendedTruckDocs(vehicle)} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
          <Link href={href(locale, "app")} className="btn btn-gold">{T.done.finish}</Link>
          {/* a plain link (full reload) starts a clean form */}
          <a href={`${href(locale, "app")}/register-truck`} className="btn btn-outline">{T.done.another}</a>
        </div>
      </div>
    );
  }

  const corridorLabel = (c: string) => word(M.corridors, c);

  return (
    <form ref={formRef} onSubmit={submit} className="mx-auto max-w-3xl" aria-label={T.title}>
      <input type="hidden" name="locale" value={locale} />
      <Stepper steps={T.steps as unknown as string[]} current={step} label={tpl(L.common.step, { n: step + 1, t: total })} onJump={goto} />
      {state.error && <FormBanner message={(L.errors as Record<string, string>)[state.error] ?? L.errors.generic} />}
      {!state.error && Object.keys(errors).length > 0 && <FormBanner message={L.common.fixErrors} />}

      {/* ----------------------------------------------------------- 1. vehicle */}
      <div ref={(el) => { panels.current[0] = el; }}>
        <Panel show={step === 0} title={T.vehicle.title}>
          <Group title={T.vehicle.type}>
            <ChoiceCards name="vehicleType" value={vehicle} onChange={pickVehicle} error={err("vehicleType")} options={VEHICLE_LIST.map((x) => ({ value: x, label: M.vehicles[x], hint: L.vehicleHints[x] }))} />
          </Group>
          <Group title={T.vehicle.make}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label={T.vehicle.make} name="makeModel" placeholder={T.vehicle.makePh} maxLength={60} requiredMark error={err("makeModel")} />
              <TextInput label={T.vehicle.year} name="year" type="number" inputMode="numeric" min={1995} max={new Date().getFullYear() + 1} placeholder="2022" requiredMark error={err("year")} />
            </div>
            <TextInput label={T.vehicle.axles} name="axles" list="axles" placeholder={T.vehicle.axlesPh} hint={T.vehicle.axlesHelp} maxLength={40} autoComplete="off" requiredMark error={err("axles")} />
            <datalist id="axles">{AXLE_SUGGESTIONS.map((a) => <option key={a} value={a} />)}</datalist>
            <TextInput label={T.vehicle.payload} name="payloadT" type="number" inputMode="decimal" step="0.5" min={1} max={120} hint={T.vehicle.payloadHelp} requiredMark error={err("payloadT")} />
          </Group>
          <Group title={T.vehicle.plate}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label={T.vehicle.plate} name="plateNumber" placeholder="T 123 ABC" maxLength={15} autoCapitalize="characters" hint={T.vehicle.plateHelp} requiredMark error={err("plateNumber")} />
              <TextInput label={T.vehicle.trailerPlate} name="trailerPlate" maxLength={15} autoCapitalize="characters" optionalText={L.common.optional} error={err("trailerPlate")} />
            </div>
          </Group>
        </Panel>
      </div>

      {/* ----------------------------------------------- 2. capacity + equipment */}
      <div ref={(el) => { panels.current[1] = el; }}>
        <Panel show={step === 1} title={T.body.title}>
          <Group title={vehicle ? M.vehicles[vehicle] : T.body.title}>
            {kind === "dimensions" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <TextInput label={T.body.length} name="bodyLength" type="number" inputMode="decimal" step="0.1" min={1} max={25} placeholder="13.6" requiredMark error={err("bodyLength")} />
                <TextInput label={T.body.width} name="bodyWidth" type="number" inputMode="decimal" step="0.1" min={1} max={4} placeholder="2.5" requiredMark error={err("bodyWidth")} />
                <TextInput label={T.body.height} name="bodyHeight" type="number" inputMode="decimal" step="0.1" min={0.3} max={5} optionalText={L.common.optional} error={err("bodyHeight")} />
              </div>
            )}
            {kind === "dimensions" && <p className="text-[13px] text-muted">{T.body.heightHelp}</p>}
            {kind === "container" && (
              <SelectInput label={T.body.container} name="containerConfig" placeholder={L.common.selectPlaceholder} options={CONTAINER_CONFIGS.map((c) => ({ value: c, label: c }))} requiredMark error={err("containerConfig")} />
            )}
            {kind === "tank" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label={T.body.tank} name="tankLitres" type="number" inputMode="numeric" min={1000} max={80000} step="500" placeholder="36000" requiredMark error={err("tankLitres")} />
                <TextInput label={T.body.compartments} name="compartments" type="number" inputMode="numeric" min={1} max={10} optionalText={L.common.optional} error={err("compartments")} />
              </div>
            )}
            {kind === "volume" && <TextInput label={T.body.volume} name="volumeM3" type="number" inputMode="decimal" step="0.5" min={3} max={120} placeholder="18" requiredMark error={err("volumeM3")} />}
          </Group>
          <Group title={T.body.featuresTitle} help={T.body.featuresHelp}>
            <CheckGroup name="features" values={features} onChange={setFeatures} options={FEATURE_LIST.map((f) => ({ value: f, label: M.features[f] }))} />
            {errors.features && <p className="text-[13px] font-medium text-danger">{err("features")}</p>}
          </Group>
          <Group title={T.body.insurance}>
            <TextInput label={T.body.insurance} name="insuranceExpiry" type="date" min={defaults.today} hint={T.body.insuranceHelp} optionalText={L.common.optional} error={err("insuranceExpiry")} />
          </Group>
        </Panel>
      </div>

      {/* ------------------------------------------------ 3. availability + routes */}
      <div ref={(el) => { panels.current[2] = el; }}>
        <Panel show={step === 2} title={T.avail.title}>
          <Group title={T.avail.title}>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectInput label={T.avail.country} name="locCC" value={locCC} onChange={(x) => setLocCC(x as Country)} options={COUNTRY_CODES.map((c) => ({ value: c, label: M.countries[c] }))} requiredMark error={err("locCC")} />
              <TextInput label={T.avail.city} name="locCity" value={locCity} onChange={(e) => setLocCity(e.target.value)} list="cities-loc" placeholder={T.avail.cityPh} autoComplete="off" requiredMark error={err("locCity")} />
            </div>
            <datalist id="cities-loc">{citiesIn(locCC).map((c) => <option key={c} value={c} />)}</datalist>
            <TextInput label={T.avail.base} name="baseAddress" hint={T.avail.baseHelp} maxLength={160} optionalText={L.common.optional} error={err("baseAddress")} />
            <Toggle name="availableNow" title={T.avail.now} checked={availNow} onChange={setAvailNow} />
            {!availNow && <TextInput label={T.avail.from} name="availableFrom" type="date" min={defaults.today} requiredMark error={err("availableFrom")} />}
          </Group>
          <Group title={T.avail.corridors} help={T.avail.corridorsHelp}>
            <CheckGroup name="corridors" values={corridors} onChange={setCorridors} columns={1} options={CORRIDOR_LIST.map((c) => ({ value: c, label: corridorLabel(c) }))} />
            {errors.corridors && <p className="text-[13px] font-medium text-danger" role="alert">{err("corridors")}</p>}
          </Group>
          <Group title={T.avail.rateTitle} help={T.avail.rateHelp}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label={T.avail.rateMin} name="rateMin" type="number" inputMode="decimal" step="0.1" min={0.2} max={20} optionalText={L.common.optional} error={err("rateMin")} />
              <TextInput label={T.avail.rateMax} name="rateMax" type="number" inputMode="decimal" step="0.1" min={0.2} max={20} optionalText={L.common.optional} error={err("rateMax")} />
            </div>
          </Group>
          <Group title={T.avail.contactTitle} help={T.avail.contactIntro}>
            <TextInput label={T.avail.contactName} name="contactName" defaultValue={defaults.contactName} autoComplete="name" requiredMark error={err("contactName")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label={T.avail.phone} name="contactPhone" type="tel" inputMode="tel" defaultValue={defaults.phone} autoComplete="tel" placeholder="+255 712 345 678" requiredMark error={err("contactPhone")} />
              <TextInput label={T.avail.email} name="contactEmail" type="email" inputMode="email" defaultValue={defaults.email} autoComplete="email" requiredMark error={err("contactEmail")} />
            </div>
          </Group>
        </Panel>
      </div>

      {/* ------------------------------------------------------------- 4. review */}
      <div ref={(el) => { panels.current[3] = el; }}>
        <Panel show={step === 3} title={T.review.title} lead={T.review.intro}>
          {snap && (
            <div className="rounded-3xl border border-line bg-surface px-5 py-2 sm:px-6">
              <SummaryRow k={T.review.vehicle} onEdit={() => goto(0)} editLabel={L.common.edit}>
                {word(M.vehicles, v("vehicleType"))} · {v("makeModel")} · {v("year")}
                <span className="block text-sm font-normal text-muted">{v("axles")} · {v("payloadT")} t · {v("plateNumber").toUpperCase()}</span>
              </SummaryRow>
              <SummaryRow k={T.review.capacity} onEdit={() => goto(1)} editLabel={L.common.edit}>
                {kind === "dimensions" && `${v("bodyLength")} × ${v("bodyWidth")}${v("bodyHeight") ? ` × ${v("bodyHeight")}` : ""} m`}
                {kind === "container" && v("containerConfig")}
                {kind === "tank" && `${Number(v("tankLitres")).toLocaleString("en-US")} L${v("compartments") ? ` · ${v("compartments")}` : ""}`}
                {kind === "volume" && `${v("volumeM3")} m³`}
                <span className="block text-sm font-normal text-muted">{snap.getAll("features").map((f) => word(M.features, String(f))).join(" · ")}</span>
              </SummaryRow>
              <SummaryRow k={T.review.location} onEdit={() => goto(2)} editLabel={L.common.edit}>
                {v("locCity")}, {M.countries[v("locCC") as Country]}
              </SummaryRow>
              <SummaryRow k={T.review.availability} onEdit={() => goto(2)} editLabel={L.common.edit}>
                {v("availableNow") ? T.review.availableNow : v("availableFrom")}
              </SummaryRow>
              <SummaryRow k={T.review.corridors} onEdit={() => goto(2)} editLabel={L.common.edit}>
                {snap.getAll("corridors").map((c) => corridorLabel(String(c))).join(" · ")}
              </SummaryRow>
              {v("rateMin") && (
                <SummaryRow k={T.review.rate} onEdit={() => goto(2)} editLabel={L.common.edit}>
                  USD {v("rateMin")} – {v("rateMax")} / km
                </SummaryRow>
              )}
            </div>
          )}
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-[15px] leading-snug">
            <input type="checkbox" name="terms" required className="mt-0.5 h-5 w-5 flex-none rounded-md border-g2 accent-gold" aria-invalid={!!errors.terms} />
            <span>{T.review.terms}</span>
          </label>
          {errors.terms && <p className="text-[13px] font-medium text-danger" role="alert">{err("terms")}</p>}
          <Hint>{T.review.afterSubmit}</Hint>
        </Panel>
      </div>

      <StepNav step={step} total={total} back={L.common.back} next={L.common.next} submit={L.common.submit} submitting={L.common.submitting} pending={pending} onBack={() => goto(step - 1)} onNext={next} />
    </form>
  );
}
