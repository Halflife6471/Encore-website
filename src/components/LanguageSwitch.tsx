"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Locale } from "@/lib/i18n-config";
import { switchLocalePath } from "@/lib/routes";

function Inner({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const search = sp.toString() ? `?${sp.toString()}` : "";
  return (
    <div role="group" aria-label={label} className="flex rounded-full border border-line p-[3px] text-[13px] font-semibold">
      {(["en", "sw"] as const).map((l) => {
        const on = l === locale;
        return (
          <Link
            key={l}
            href={switchLocalePath(pathname, search, l)}
            hrefLang={l}
            lang={l}
            aria-current={on ? "true" : undefined}
            className={`rounded-full px-3 py-1.5 transition ${on ? "bg-fg text-page" : "text-muted hover:text-fg"}`}
          >
            {l.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}

export function LanguageSwitch(props: { locale: Locale; label: string }) {
  return (
    <Suspense fallback={<div className="h-9 w-[88px] rounded-full border border-line" />}>
      <Inner {...props} />
    </Suspense>
  );
}
