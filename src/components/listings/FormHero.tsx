import Link from "next/link";
import type { ReactNode } from "react";

/** Compact page header used by the listing forms, with a way back to the account. */
export function FormHero({ title, lead, back, backHref, children }: { title: string; lead?: string; back: string; backHref: string; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b border-line bg-surface">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-56 w-[30rem] rounded-full bg-gold/25 blur-3xl" />
      <div className="container-x relative py-8 sm:py-11">
        <Link href={backHref} className="text-sm font-semibold text-muted underline decoration-gold decoration-2 underline-offset-4 hover:text-fg">← {back}</Link>
        <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">{title}</h1>
        {lead && <p className="mt-3 max-w-3xl text-base font-light leading-relaxed text-muted sm:text-lg">{lead}</p>}
        {children}
      </div>
    </div>
  );
}
