"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, newPasswordAction, staffLoginAction } from "@/lib/actions/auth";
import { submitLeadAction } from "@/lib/actions/leads";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { href } from "@/lib/routes";
import { IconLock, IconMail, IconUser } from "../ui";
import { FormBanner, Honeypot, PasswordField, PhoneField, SubmitButton, TextField, errText } from "./fields";

/* --------------------------------------------------------- forgot password */
export function ForgotForm({ locale, d }: { locale: Locale; d: Dict }) {
  const [state, action, pending] = useActionState(forgotPasswordAction, {});
  const t = d.auth.reset;
  const errs = d.auth.errors as unknown as Record<string, string>;
  if (state.ok) {
    return (
      <div role="status" className="rounded-3xl border border-g1 p-8 shadow-soft">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-gold"><IconMail className="h-7 w-7" /></span>
        <h1 className="mt-5 text-3xl font-semibold">{t.sentTitle}</h1>
        <p className="mt-3 text-g3">{t.sentText}</p>
        <Link href={href(locale, "login")} className="btn btn-outline btn-sm mt-6">{d.auth.register.signIn}</Link>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-center text-4xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-center text-[17px] font-light text-g3">{t.subtitle}</p>
      <form action={action} className="mt-6 space-y-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        {state.error && <FormBanner message={errText(errs, state.error)} />}
        <TextField label={d.auth.login.emailLabel} name="email" type="email" inputMode="email" autoComplete="email" icon={<IconMail />} placeholder="name@company.com" defaultValue={state.values?.email} error={errText(errs, state.fieldErrors?.email)} />
        <SubmitButton pending={pending} pendingText={d.common.loading}>{t.submit}</SubmitButton>
      </form>
      <p className="mt-5 text-center"><Link href={href(locale, "login")} className="font-semibold underline decoration-gold decoration-2 underline-offset-4">{d.auth.staff.back}</Link></p>
    </div>
  );
}

/* ------------------------------------------------------------ new password */
export function NewPasswordForm({ locale, d, first }: { locale: Locale; d: Dict; first?: boolean }) {
  const [state, action, pending] = useActionState(newPasswordAction, {});
  const t = d.auth.reset;
  const errs = d.auth.errors as unknown as Record<string, string>;
  const fe = state.fieldErrors ?? {};
  return (
    <div>
      <h1 className="text-center text-4xl font-semibold tracking-tight">{t.newTitle}</h1>
      {first && <p className="mt-2 text-center text-[15px] text-g3">{d.auth.staff.subtitle}</p>}
      <form action={action} className="mt-6 space-y-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        {state.error && <FormBanner message={errText(errs, state.error)} />}
        <PasswordField label={d.auth.register.password} autoComplete="new-password" icon={<IconLock />} meter hint={d.auth.register.passwordHint} error={errText(errs, fe.password)} />
        <PasswordField label={t.confirm} name="confirm" autoComplete="new-password" icon={<IconLock />} error={errText(errs, fe.confirm)} />
        <SubmitButton pending={pending} pendingText={d.common.loading}>{t.newSubmit}</SubmitButton>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------- staff login */
export function StaffLoginForm({ locale, d }: { locale: Locale; d: Dict }) {
  const [state, action, pending] = useActionState(staffLoginAction, {});
  const t = d.auth.staff;
  const errs = d.auth.errors as unknown as Record<string, string>;
  const fe = state.fieldErrors ?? {};
  return (
    <div>
      <h1 className="text-center text-4xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-center text-[17px] font-light text-g3">{t.subtitle}</p>
      <form action={action} className="relative mt-6 space-y-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <Honeypot />
        {state.error && <FormBanner message={errText(errs, state.error)} />}
        <TextField label={t.username} name="username" icon={<IconUser />} placeholder={t.usernamePh} autoComplete="username" defaultValue={state.values?.username} error={errText(errs, fe.username)} />
        <PasswordField label={d.auth.login.password} icon={<IconLock />} error={errText(errs, fe.password)} />
        <SubmitButton pending={pending} pendingText={d.auth.login.submitting}>{t.submit}</SubmitButton>
      </form>
      <p className="mt-5 text-center text-[13.5px] text-g3">{t.note}</p>
      <p className="mt-3 text-center"><Link href={href(locale, "login")} className="font-semibold underline decoration-gold decoration-2 underline-offset-4">{t.back}</Link></p>
    </div>
  );
}

/* -------------------------------------------------- contact / lead capture */
export function LeadForm({
  locale,
  d,
  leadType = "general",
  defaultCategory = "other",
  corridor = true,
  defaultCorridor,
  idPrefix = "lead",
}: {
  locale: Locale;
  d: Dict;
  leadType?: "general" | "partner" | "driver_help" | "cargo_owner" | "transporter";
  defaultCategory?: "cargo_owner" | "transporter" | "driver" | "partner" | "other";
  corridor?: boolean;
  defaultCorridor?: string;
  idPrefix?: string;
}) {
  const [state, action, pending] = useActionState(submitLeadAction, {});
  const f = d.contact.form;
  const errs = d.auth.errors as unknown as Record<string, string>;
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div role="status" className="rounded-3xl border border-g1 bg-white p-8 shadow-soft">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-gold text-2xl">✓</span>
        <h3 className="mt-4 text-2xl font-bold">{f.successTitle}</h3>
        <p className="mt-2 text-g3">{f.successText} <strong className="text-char">{state.reference}</strong>. {f.successFollow}</p>
      </div>
    );
  }
  const banner = state.error === "unavailable" ? f.unavailable : state.error === "locked" ? f.rate : state.error ? f.errorGeneric : undefined;

  return (
    <form action={action} className="relative space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="leadType" value={leadType} />
      <Honeypot />
      <FormBanner message={banner} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={f.fullName} name="fullName" autoComplete="name" defaultValue={v.fullName} error={errText(errs, fe.fullName)} />
        <TextField label={f.company} name="company" autoComplete="organization" defaultValue={v.company} error={errText(errs, fe.company)} />
      </div>
      <TextField label={f.email} name="email" type="email" inputMode="email" autoComplete="email" defaultValue={v.email} error={errText(errs, fe.email)} />
      <PhoneField label={`${f.phone} (${d.common.optional})`} locale={locale} defaultDial={v.dial} defaultPhone={v.phone} error={errText(errs, fe.phone)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-cat`} className="label">{f.category}</label>
          <select id={`${idPrefix}-cat`} name="category" defaultValue={v.category ?? defaultCategory} className="input">
            {Object.entries(f.categories).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </div>
        {corridor && (
          <div>
            <label htmlFor={`${idPrefix}-cor`} className="label">{f.corridor}</label>
            <select id={`${idPrefix}-cor`} name="corridor" defaultValue={v.corridor ?? defaultCorridor ?? ""} className="input">
              {Object.entries(f.corridors).map(([k, label]) => <option key={k || "none"} value={k}>{label}</option>)}
            </select>
          </div>
        )}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-msg`} className="label">{f.message}</label>
        <textarea id={`${idPrefix}-msg`} name="message" rows={5} defaultValue={v.message} aria-invalid={!!fe.message} className="input h-auto py-3" />
        {fe.message && <p role="alert" className="mt-1.5 text-[13px] font-medium text-danger">{errText(errs, fe.message)}</p>}
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-[13.5px] leading-snug text-g3">
        <input type="checkbox" name="consent" defaultChecked={v.consent === "on"} className="mt-0.5 h-5 w-5 flex-none rounded-md border-g2 accent-char" aria-invalid={!!fe.consent} />
        <span>{f.consent}</span>
      </label>
      {fe.consent && <p role="alert" className="text-[13px] font-medium text-danger">{errText(errs, fe.consent)}</p>}
      <label className="flex cursor-pointer items-start gap-3 text-[13.5px] leading-snug text-g3">
        <input type="checkbox" name="updates" defaultChecked={v.updates === "on"} className="mt-0.5 h-5 w-5 flex-none rounded-md border-g2 accent-char" />
        <span>{f.updates}</span>
      </label>
      <SubmitButton pending={pending} pendingText={f.sending}>{f.submit}</SubmitButton>
    </form>
  );
}
