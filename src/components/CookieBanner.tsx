"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { href } from "@/lib/routes";

const KEY = "enc_consent";

/** Analytics must stay off until the visitor consents (SRS §30.5, SRD WEB-046). */
export function CookieBanner({ locale, d }: { locale: Locale; d: Dict["cookie"] }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(!localStorage.getItem(KEY));
    } catch {
      setShow(true);
    }
  }, []);

  const choose = (v: "essential" | "all") => {
    try { localStorage.setItem(KEY, v); } catch { /* storage unavailable */ }
    document.cookie = `${KEY}=${v}; path=/; max-age=${180 * 86400}; samesite=lax`;
    window.dispatchEvent(new CustomEvent("encore:consent", { detail: v }));
    setShow(false);
  };
  if (!show) return null;
  return (
    <div role="dialog" aria-label={d.title} className="fixed inset-x-3 bottom-3 z-50 max-w-md rounded-3xl border border-line bg-surface p-5 shadow-lift sm:left-5 sm:right-auto">
      <p className="font-bold">{d.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {d.text}{" "}
        <Link href={href(locale, "privacy")} className="font-semibold text-fg underline decoration-gold decoration-2 underline-offset-2">{d.policy}</Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => choose("essential")} className="btn btn-outline btn-sm">{d.essential}</button>
        <button type="button" onClick={() => choose("all")} className="btn btn-primary btn-sm">{d.accept}</button>
      </div>
    </div>
  );
}
