"use client";

import { useActionState, useEffect, useState } from "react";
import { resendVerificationAction } from "@/lib/actions/auth";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { FormBanner, errText } from "./fields";

/** Resend the verification link, with a visible 60-second cool-down matching the server limit. */
export function ResendForm({ email, locale, d }: { email: string; locale: Locale; d: Dict }) {
  const [state, action, pending] = useActionState(resendVerificationAction, {});
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (state.ok || state.error === "locked") setWait(60);
  }, [state]);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const errs = d.auth.errors as unknown as Record<string, string>;
  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="locale" value={locale} />
      {state.ok && <FormBanner tone="ok" message={d.auth.register.resent} />}
      {state.error && state.error !== "locked" && <FormBanner message={errText(errs, state.error)} />}
      <button type="submit" disabled={pending || wait > 0} className="btn btn-outline btn-sm">
        {wait > 0 ? `${d.auth.register.resendWait} ${wait}s` : d.auth.register.resend}
      </button>
    </form>
  );
}
