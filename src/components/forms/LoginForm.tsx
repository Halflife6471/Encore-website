"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction } from "@/lib/actions/auth";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { href } from "@/lib/routes";
import { IconLock, IconMail, IconUserPlus } from "../ui";
import { FormBanner, Honeypot, PasswordField, PhoneField, SubmitButton, TextField, errText } from "./fields";
import { ResendForm } from "./ResendForm";

export function LoginForm({ locale, d, notice }: { locale: Locale; d: Dict; notice?: "link_expired" | "verified" }) {
  const [state, action, pending] = useActionState(loginAction, {});
  const [mode, setMode] = useState<"email" | "phone">((state.values?.mode as "email" | "phone") || "email");
  const l = d.auth.login;
  const errs = d.auth.errors as unknown as Record<string, string>;
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};

  return (
    <div>
      <h1 className="text-center text-4xl font-semibold tracking-tight">{l.title}</h1>
      <p className="mt-2 text-center text-[17px] font-light text-muted">{l.subtitle}</p>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-goldline bg-gradient-to-r from-goldsoft to-page p-3.5 pl-4">
        <div className="flex items-center gap-3.5">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-ink text-white"><IconUserPlus className="h-[22px] w-[22px]" /></span>
          <div className="leading-tight">
            <p className="font-medium">{l.newTitle}</p>
            <p className="text-[13px] text-muted">{l.newText}</p>
          </div>
        </div>
        <Link href={href(locale, "register")} className="btn btn-primary btn-sm rounded-xl">{l.signUp}</Link>
      </div>

      <form action={action} className="relative mt-5" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="mode" value={mode} />
        <Honeypot />

        {notice === "link_expired" && <FormBanner tone="info" message={l.linkExpired} />}
        {notice === "verified" && <FormBanner tone="ok" message={l.verified} />}
        {state.error && <FormBanner message={errText(errs, state.error)} />}
        {state.error === "not_confirmed" && state.email && <ResendForm email={state.email} locale={locale} d={d} />}

        <div role="tablist" aria-label="Sign-in method" className="mb-4 grid grid-cols-2 rounded-2xl bg-soft p-1.5">
          {(["email", "phone"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-xl py-3 text-base font-medium transition ${mode === m ? "bg-surface text-fg shadow-[0_1px_4px_rgba(29,29,27,.12)]" : "text-muted"}`}
            >
              {m === "email" ? l.email : l.phone}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {mode === "email" ? (
            <TextField label={l.emailLabel} name="email" type="email" inputMode="email" autoComplete="username" placeholder="name@company.com" icon={<IconMail />} defaultValue={v.email} error={errText(errs, fe.email)} />
          ) : (
            <PhoneField label={l.phoneLabel} locale={locale} defaultDial={v.dial} defaultPhone={v.phone} error={errText(errs, fe.phone)} />
          )}
          <PasswordField label={l.password} icon={<IconLock />} placeholder="••••••••" error={errText(errs, fe.password)} />
        </div>

        <div className="my-5 flex items-center justify-between text-[15px]">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" name="remember" defaultChecked className="h-5 w-5 rounded-md border-g2 accent-gold" />
            {l.remember}
          </label>
          <Link href={`${href(locale, "reset")}`} className="font-medium underline decoration-gold decoration-2 underline-offset-4">{l.forgot}</Link>
        </div>

        <SubmitButton pending={pending} pendingText={l.submitting}>{l.submit}</SubmitButton>
      </form>

      <p className="mt-6 text-center text-[15px] text-muted">
        {l.staff}{" "}
        <Link href={href(locale, "staff")} className="font-semibold text-fg underline decoration-gold decoration-2 underline-offset-4">{l.staffLink}</Link>
      </p>
      <p className="mt-2 text-center text-[13px] text-muted">
        {l.terms}{" "}
        <Link href={href(locale, "terms")} className="underline">{d.legal.terms.title}</Link> {l.and}{" "}
        <Link href={href(locale, "privacy")} className="underline">{d.legal.privacy.title}</Link>
      </p>
    </div>
  );
}
