"use client";

import { useId, useState, type ReactNode } from "react";
import { COUNTRIES } from "@/lib/countries";
import type { Locale } from "@/lib/i18n-config";
import { IconEye, IconEyeOff, IconPhone } from "../ui";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[13px] font-medium text-danger">
      {message}
    </p>
  );
}

export function FormBanner({ message, tone = "error" }: { message?: string; tone?: "error" | "ok" | "info" }) {
  if (!message) return null;
  const cls = tone === "ok" ? "border-ok/40 bg-ok/5 text-ok" : tone === "info" ? "border-gold bg-goldtint text-char" : "border-danger/40 bg-danger/5 text-danger";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`mb-4 rounded-2xl border px-4 py-3 text-[15px] font-medium ${cls}`}>
      {message}
    </div>
  );
}

type TextProps = {
  label: string;
  name: string;
  type?: string;
  icon?: ReactNode;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  maxLength?: number;
};

export function TextField({ label, name, type = "text", icon, placeholder, defaultValue, error, autoComplete, required, hint, inputMode, maxLength }: TextProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-g2 [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>}
        <input
          id={id}
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
          className={`input ${icon ? "pl-12" : ""}`}
        />
      </div>
      {hint && !error && <p id={`${id}-h`} className="mt-1.5 text-[13px] text-g3">{hint}</p>}
      <FieldError id={`${id}-e`} message={error} />
    </div>
  );
}

function strength(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return /[A-Za-z]/.test(pw) && /\d/.test(pw) ? Math.max(s, 1) : Math.min(s, 1);
}

export function PasswordField({ label, name = "password", placeholder, error, autoComplete = "current-password", hint, meter = false, icon }: { label: string; name?: string; placeholder?: string; error?: string; autoComplete?: string; hint?: string; meter?: boolean; icon?: ReactNode }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState("");
  const score = strength(pw);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-g2 [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>}
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => setPw(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
          className={`input pr-12 ${icon ? "pl-12" : ""}`}
        />
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-g3 hover:bg-tint">
          {show ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
        </button>
      </div>
      {meter && pw && (
        <div className="mt-2 flex gap-1.5" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? "bg-gold" : "bg-g1"}`} />
          ))}
        </div>
      )}
      {hint && !error && <p id={`${id}-h`} className="mt-1.5 text-[13px] text-g3">{hint}</p>}
      <FieldError id={`${id}-e`} message={error} />
    </div>
  );
}

/** Country dial-code selector + national number (E.164 normalised on the server). TZ +255 by default. */
export function PhoneField({
  label,
  locale,
  placeholder = "7** *** ***",
  error,
  defaultDial = "TZ",
  defaultPhone,
  required,
  required_mark,
}: {
  label: string;
  locale: Locale;
  placeholder?: string;
  error?: string;
  defaultDial?: string;
  defaultPhone?: string;
  required?: boolean;
  required_mark?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={`${id}-p`} className="label">
        {label} {required_mark && <span className="text-danger" aria-hidden>*</span>}
      </label>
      <div className="grid grid-cols-[132px_1fr] gap-3">
        <select name="dial" defaultValue={defaultDial} aria-label="Country code" className="input appearance-none bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-8 font-medium" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%233D4348' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")" }}>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.code} +{c.dial}</option>
          ))}
        </select>
        <div className="relative">
          <IconPhone className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-g2" />
          <input
            id={`${id}-p`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={placeholder}
            defaultValue={defaultPhone}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-e` : undefined}
            className="input pl-12"
          />
        </div>
      </div>
      <span className="sr-only">{locale}</span>
      <FieldError id={`${id}-e`} message={error} />
    </div>
  );
}

/** Off-screen honeypot: humans never see it, naive bots fill it in. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Company website
        <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function SubmitButton({ pending, children, pendingText, className = "" }: { pending: boolean; children: ReactNode; pendingText: string; className?: string }) {
  return (
    <button type="submit" disabled={pending} className={`btn btn-primary h-14 w-full rounded-[14px] text-lg ${className}`}>
      {pending ? pendingText : children}
    </button>
  );
}

export const errText = (dict: Record<string, string>, code?: string) => (code ? dict[code] ?? dict.generic : undefined);
