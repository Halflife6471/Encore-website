"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction } from "@/lib/actions/auth";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { href } from "@/lib/routes";
import { IconBox, IconCheck, IconLink, IconLock, IconMail, IconTruck, IconUser, IconWheel } from "../ui";
import { FormBanner, Honeypot, PasswordField, PhoneField, SubmitButton, TextField, errText } from "./fields";
import { ResendForm } from "./ResendForm";

type Role = "cargo_owner" | "transporter";

export function RegisterForm({ locale, d, referral }: { locale: Locale; d: Dict; referral?: string }) {
  const [state, action, pending] = useActionState(registerAction, {});
  const r = d.auth.register;
  const errs = d.auth.errors as unknown as Record<string, string>;
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};
  const [role, setRole] = useState<Role>((v.accountType as Role) || "cargo_owner");
  const [showRef, setShowRef] = useState(!!(referral || v.referral));

  if (state.ok && state.email) {
    return (
      <div className="rounded-3xl border border-g1 bg-white p-8 shadow-soft" role="status">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-gold"><IconMail className="h-7 w-7" /></span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">{r.verifyTitle}</h1>
        <p className="mt-3 text-g3">{r.verifyText} <strong className="text-char">{state.email}</strong>.</p>
        <p className="mt-4 rounded-2xl bg-goldtint p-4 text-[15px]">{r.verifyNote}</p>
        <ResendForm email={state.email} locale={locale} d={d} />
        <p className="mt-6 text-[15px] text-g3">
          <Link href={href(locale, "login")} className="font-semibold text-char underline decoration-gold decoration-2 underline-offset-4">{r.signIn}</Link>
        </p>
      </div>
    );
  }

  const roleCard = (key: Role, Icon: typeof IconBox, text: { t: string; d: string }) => {
    const on = role === key;
    return (
      <button
        key={key}
        type="button"
        role="radio"
        aria-checked={on}
        onClick={() => setRole(key)}
        className={`relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${on ? "border-2 border-char bg-goldtint" : "border-g1 bg-white hover:border-g2"}`}
      >
        <span className={`grid h-11 w-11 flex-none place-items-center rounded-xl ${on ? "bg-char text-gold" : "bg-tint text-char"}`}><Icon className="h-6 w-6" /></span>
        <span className="min-w-0 leading-tight">
          <span className="block font-semibold">{text.t}</span>
          <span className="block text-[12.5px] text-g3">{text.d}</span>
        </span>
        {on && <span className="absolute right-3 top-3 grid h-[22px] w-[22px] place-items-center rounded-full bg-char text-white"><IconCheck className="h-3 w-3" /></span>}
      </button>
    );
  };
  const inviteCard = (to: "drivers" | "partners", Icon: typeof IconBox, text: { t: string; d: string }) => (
    <Link key={to} href={href(locale, to)} className="relative flex items-center gap-3 rounded-2xl border border-dashed border-g2 bg-tint p-3.5 transition hover:border-char">
      <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-white"><Icon className="h-6 w-6" /></span>
      <span className="min-w-0 leading-tight">
        <span className="block font-semibold">{text.t}</span>
        <span className="block text-[12.5px] text-g3">{text.d}</span>
      </span>
      <span className="chip absolute right-2.5 top-2.5 bg-g1 !px-2 !py-0.5 text-[10px] text-char">{r.invite}</span>
    </Link>
  );

  return (
    <div>
      <h1 className="text-center text-4xl font-semibold tracking-tight">{r.title}</h1>
      <p className="mx-auto mt-2 max-w-md text-center text-[17px] font-light text-g3">{r.subtitle}</p>

      <form action={action} className="relative mt-6 space-y-4" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="accountType" value={role} />
        <Honeypot />
        {state.error && <FormBanner message={errText(errs, state.error)} />}
        {state.error === "exists" && (
          <p className="-mt-2 text-[15px]">
            <Link href={href(locale, "login")} className="font-semibold underline decoration-gold decoration-2">{r.signIn}</Link>
            {" · "}
            <Link href={href(locale, "reset")} className="font-semibold underline decoration-gold decoration-2">{d.auth.login.forgot}</Link>
          </p>
        )}

        <div>
          <p className="label" id="role-label">{r.typeLabel}</p>
          <div role="radiogroup" aria-labelledby="role-label" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {roleCard("cargo_owner", IconBox, r.cargo)}
            {roleCard("transporter", IconTruck, r.transporter)}
            {inviteCard("drivers", IconWheel, r.driver)}
            {inviteCard("partners", IconLink, r.affiliate)}
          </div>
          <FieldErrorLine msg={errText(errs, fe.accountType)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={r.fullName} name="fullName" placeholder={r.fullNamePh} icon={<IconUser />} autoComplete="name" defaultValue={v.fullName} error={errText(errs, fe.fullName)} />
          <TextField label={role === "transporter" ? r.businessReq : r.business} name="businessName" placeholder={r.businessPh} icon={<IconBox />} autoComplete="organization" defaultValue={v.businessName} error={errText(errs, fe.businessName)} />
        </div>
        <TextField label={r.email} name="email" type="email" inputMode="email" placeholder={r.emailPh} icon={<IconMail />} autoComplete="email" defaultValue={v.email} error={errText(errs, fe.email)} />
        <PhoneField label={r.phone} locale={locale} placeholder={r.phonePh} required_mark defaultDial={v.dial} defaultPhone={v.phone} error={errText(errs, fe.phone || fe.dial)} />
        <PasswordField label={r.password} icon={<IconLock />} placeholder={r.passwordPh} autoComplete="new-password" meter hint={r.passwordHint} error={errText(errs, fe.password)} />

        {showRef ? (
          <TextField label={r.referralLabel} name="referral" placeholder="ENC-XXXX" defaultValue={v.referral ?? referral} maxLength={24} error={errText(errs, fe.referral)} hint={referral ? r.referralApplied : undefined} />
        ) : (
          <p className="text-[13.5px] text-g3">
            {r.referralPrompt}{" "}
            <button type="button" onClick={() => setShowRef(true)} className="font-semibold text-char underline decoration-gold decoration-2 underline-offset-2">{r.referralAdd}</button>
          </p>
        )}

        <label className="flex cursor-pointer items-start gap-3 text-[13.5px] leading-snug text-g3">
          <input type="checkbox" name="terms" defaultChecked={v.terms === "on"} className="mt-0.5 h-5 w-5 flex-none rounded-md border-g2 accent-char" aria-invalid={!!fe.terms} />
          <span>
            {r.terms}{" "}
            <Link href={href(locale, "terms")} target="_blank" className="underline">{d.legal.terms.title}</Link> ·{" "}
            <Link href={href(locale, "privacy")} target="_blank" className="underline">{d.legal.privacy.title}</Link>
          </span>
        </label>
        <FieldErrorLine msg={errText(errs, fe.terms)} />
        <label className="flex cursor-pointer items-start gap-3 text-[13.5px] leading-snug text-g3">
          <input type="checkbox" name="marketing" defaultChecked={v.marketing === "on"} className="mt-0.5 h-5 w-5 flex-none rounded-md border-g2 accent-char" />
          <span>{r.marketing}</span>
        </label>

        <SubmitButton pending={pending} pendingText={r.submitting}>{r.submit}</SubmitButton>
      </form>

      <p className="mt-5 text-center text-[15px] text-g3">
        {r.haveAccount}{" "}
        <Link href={href(locale, "login")} className="font-semibold text-char underline decoration-gold decoration-2 underline-offset-4">{r.signIn}</Link>
      </p>
    </div>
  );
}

function FieldErrorLine({ msg }: { msg?: string }) {
  return msg ? <p role="alert" className="mt-1.5 text-[13px] font-medium text-danger">{msg}</p> : null;
}
