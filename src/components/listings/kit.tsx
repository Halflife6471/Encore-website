"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { FieldError } from "../forms/fields";
import { IconCheck } from "../ui";

/* ------------------------------------------------------------------ Field */
type A11y = { id: string; "aria-invalid": boolean; "aria-describedby"?: string };

export function Field({
  label, hint, error, optionalText, requiredMark, children,
}: {
  label: string; hint?: string; error?: string; optionalText?: string; requiredMark?: boolean; children: (a: A11y) => ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {requiredMark && <span aria-hidden className="text-danger"> *</span>}
        {optionalText && <span className="ml-1.5 text-[13px] font-normal text-muted">({optionalText})</span>}
      </label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-e` : hint ? `${id}-h` : undefined })}
      {hint && !error && <p id={`${id}-h`} className="mt-1.5 text-[13px] text-muted">{hint}</p>}
      <FieldError id={`${id}-e`} message={error} />
    </div>
  );
}

type Extra = { label: string; name: string; error?: string; hint?: string; optionalText?: string; requiredMark?: boolean };

export function TextInput({ label, name, error, hint, optionalText, requiredMark, ...rest }: Extra & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "className">) {
  return (
    <Field label={label} hint={hint} error={error} optionalText={optionalText} requiredMark={requiredMark}>
      {(a) => <input {...rest} {...a} name={name} required={requiredMark || rest.required} className="input" />}
    </Field>
  );
}

export function TextArea({ label, name, error, hint, optionalText, requiredMark, ...rest }: Extra & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "className">) {
  return (
    <Field label={label} hint={hint} error={error} optionalText={optionalText} requiredMark={requiredMark}>
      {(a) => <textarea rows={3} {...rest} {...a} name={name} className="input h-auto min-h-[88px] py-3" />}
    </Field>
  );
}

const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%233D4348' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")";

export function SelectInput({
  label, name, options, placeholder, error, hint, optionalText, requiredMark, value, onChange, defaultValue,
}: Extra & {
  options: { value: string; label: string }[]; placeholder?: string; value?: string; defaultValue?: string; onChange?: (v: string) => void;
}) {
  return (
    <Field label={label} hint={hint} error={error} optionalText={optionalText} requiredMark={requiredMark}>
      {(a) => (
        <select
          {...a}
          name={name}
          required={requiredMark}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className="input appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10"
          style={{ backgroundImage: chevron }}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </Field>
  );
}

/* ---------------------------------------------------------- choice widgets */
/** A group of checkboxes shown as tappable chips. Values are controlled so suggestions can pre-tick them. */
export function CheckGroup({
  name, options, values, onChange, columns = 2,
}: {
  name: string; options: { value: string; label: string }[]; values: string[]; onChange: (v: string[]) => void; columns?: 1 | 2 | 3;
}) {
  const toggle = (v: string) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  const cols = columns === 1 ? "" : columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";
  return (
    <div className={`grid gap-2.5 ${cols}`}>
      {options.map((o) => {
        const on = values.includes(o.value);
        return (
          <label key={o.value} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-[15px] leading-snug transition ${on ? "border-2 border-fg bg-goldsoft" : "border-line bg-surface hover:border-g2"}`}>
            <input type="checkbox" name={name} value={o.value} checked={on} onChange={() => toggle(o.value)} className="sr-only" />
            <span className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-md border ${on ? "border-fg bg-ink text-gold" : "border-g2 bg-page"}`}>{on && <IconCheck className="h-3 w-3" />}</span>
            <span className="font-medium">{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}

/** A single yes/no switch with a title and a helper line. */
export function Toggle({
  name, title, help, checked, onChange,
}: { name: string; title: string; help?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition ${checked ? "border-2 border-fg bg-goldsoft" : "border-line bg-surface hover:border-g2"}`}>
      <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span aria-hidden className={`relative mt-0.5 h-6 w-11 flex-none rounded-full transition ${checked ? "bg-ink" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-gold transition-all ${checked ? "left-[22px]" : "left-0.5 !bg-surface"}`} />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        {help && <span className="mt-0.5 block text-[13.5px] text-muted">{help}</span>}
      </span>
    </label>
  );
}

/** Radio cards with a one-line explanation: used for the vehicle type. */
export function ChoiceCards({
  name, options, value, onChange, error, suggested = [],
}: {
  name: string; options: { value: string; label: string; hint?: string }[]; value: string; onChange: (v: string) => void; error?: string; suggested?: string[];
}) {
  return (
    <div role="radiogroup" className="grid gap-2.5 sm:grid-cols-2">
      {options.map((o, i) => {
        const on = value === o.value;
        return (
          <label key={o.value} className={`relative flex cursor-pointer flex-col gap-0.5 rounded-2xl border p-3.5 transition ${on ? "border-2 border-fg bg-goldsoft" : "border-line bg-surface hover:border-g2"}`}>
            <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} required={i === 0} className="sr-only" />
            <span className="flex items-center gap-2 font-semibold">
              {o.label}
              {suggested.includes(o.value) && <span className="chip bg-gold !px-2 !py-0.5 text-[10px] text-ongold">★</span>}
            </span>
            {o.hint && <span className="text-[13px] leading-snug text-muted">{o.hint}</span>}
            {on && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-ink text-gold"><IconCheck className="h-3 w-3" /></span>}
          </label>
        );
      })}
      {error && <p className="col-span-full text-[13px] font-medium text-danger" role="alert">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ layout */
export function Stepper({ steps, current, label, onJump }: { steps: string[]; current: number; label: string; onJump: (i: number) => void }) {
  return (
    <div className="mb-8">
      <p className="mb-3 text-sm font-semibold text-muted sm:hidden">{label} · <span className="text-fg">{steps[current]}</span></p>
      <ol className="flex items-center gap-1.5 sm:gap-2" aria-label={label}>
        {steps.map((s, i) => {
          const done = i < current;
          const on = i === current;
          return (
            <li key={s} className="flex flex-1 items-center gap-2 sm:flex-initial">
              <button
                type="button"
                disabled={i > current}
                onClick={() => i < current && onJump(i)}
                aria-current={on ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full text-sm font-semibold transition ${on ? "sm:bg-fg sm:pr-4 sm:text-page" : "text-muted"} ${i < current ? "cursor-pointer hover:text-fg" : ""}`}
              >
                <span className={`grid h-8 w-8 flex-none place-items-center rounded-full text-xs font-bold ${on ? "bg-gold text-ongold" : done ? "bg-ink text-gold" : "bg-line text-muted"}`}>
                  {done ? <IconCheck className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={`${on ? "hidden sm:inline" : "hidden lg:inline"}`}>{s}</span>
              </button>
              {i < steps.length - 1 && <span aria-hidden className={`h-0.5 flex-1 rounded-full sm:w-6 sm:flex-none ${done ? "bg-ink" : "bg-line"}`} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function StepNav({
  step, total, back, next, submit, submitting, pending, onBack, onNext,
}: {
  step: number; total: number; back: string; next: string; submit: string; submitting: string; pending: boolean; onBack: () => void; onNext: () => void;
}) {
  const last = step === total - 1;
  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
      {step > 0 ? <button type="button" onClick={onBack} disabled={pending} className="btn btn-outline">{back}</button> : <span />}
      {last ? (
        <button type="submit" disabled={pending} className="btn btn-gold min-w-[12rem]">{pending ? submitting : submit}</button>
      ) : (
        <button type="button" onClick={onNext} className="btn btn-primary min-w-[10rem]">{next}</button>
      )}
    </div>
  );
}

export function Panel({ show, title, lead, children }: { show: boolean; title: string; lead?: string; children: ReactNode }) {
  return (
    <div hidden={!show}>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {lead && <p className="mt-2 text-muted">{lead}</p>}
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}

export function Group({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <legend className="px-2 text-sm font-bold uppercase tracking-[0.12em] text-muted">{title}</legend>
      {help && <p className="-mt-1 mb-4 text-[14px] text-muted">{help}</p>}
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

export function Hint({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "ok" }) {
  return (
    <p className={`rounded-2xl px-4 py-3 text-[14.5px] leading-snug ${tone === "ok" ? "bg-goldsoft" : "bg-soft text-muted"}`}>{children}</p>
  );
}

export function SummaryRow({ k, children, onEdit, editLabel }: { k: string; children: ReactNode; onEdit?: () => void; editLabel?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3.5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{k}</p>
        <div className="mt-1 break-words font-medium leading-snug">{children}</div>
      </div>
      {onEdit && <button type="button" onClick={onEdit} className="flex-none text-sm font-semibold underline decoration-gold decoration-2 underline-offset-4">{editLabel}</button>}
    </div>
  );
}
