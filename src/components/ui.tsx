import Image from "next/image";
import Link from "next/link";
import type { ReactNode, SVGProps } from "react";

/* ----------------------------------------------------------------- Logo */
export function Logo({ variant = "default", className = "h-11 w-auto" }: { variant?: "default" | "reversed"; className?: string }) {
  return (
    <Image
      src={variant === "reversed" ? "/brand/encore-logo-horizontal-reversed.png" : "/brand/encore-logo-horizontal.png"}
      alt="Encore Holdings Group"
      width={1520}
      height={442}
      priority
      className={className}
    />
  );
}

/* ---------------------------------------------------------------- Icons */
type P = SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", "aria-hidden": true } as const;
export const IconPhone = (p: P) => (<svg {...base} {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>);
export const IconArrow = (p: P) => (<svg {...base} strokeWidth={2} {...p}><path d="M4 12h16M14 6l6 6-6 6" /></svg>);
export const IconMail = (p: P) => (<svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>);
export const IconLock = (p: P) => (<svg {...base} {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>);
export const IconEye = (p: P) => (<svg {...base} {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>);
export const IconEyeOff = (p: P) => (<svg {...base} {...p}><path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.7M6.5 6.9C3.7 8.7 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>);
export const IconUser = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>);
export const IconUserPlus = (p: P) => (<svg {...base} {...p}><circle cx="10" cy="8" r="4" /><path d="M2 21c1-4 4-6 8-6s6 1.5 7 4M19 8v6M16 11h6" /></svg>);
export const IconCheck = (p: P) => (<svg {...base} strokeWidth={2.6} {...p}><path d="M5 12.5l4.5 4.5L19 7" /></svg>);
export const IconBox = (p: P) => (<svg {...base} {...p}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9" /></svg>);
export const IconTruck = (p: P) => (<svg {...base} {...p}><path d="M2 6h11v10H2zM13 9h4l4 4v3h-8" /><circle cx="7" cy="17.5" r="2" fill="#fff" /><circle cx="17" cy="17.5" r="2" fill="#fff" /></svg>);
export const IconWheel = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.2" /><path d="M12 14.2V21M10 11L3.5 9M14 11l6.5-2" /></svg>);
export const IconLink = (p: P) => (<svg {...base} {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>);
export const IconChat = (p: P) => (<svg {...base} {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>);
export const IconInstagram = (p: P) => (<svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg>);
export const IconFacebook = (p: P) => (<svg {...base} {...p}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5A.5.5 0 0 1 14 8z" /></svg>);
export const IconMenu = (p: P) => (<svg {...base} strokeWidth={2} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const IconClose = (p: P) => (<svg {...base} strokeWidth={2} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const IconChevron = (p: P) => (<svg {...base} strokeWidth={2} {...p}><path d="M6 9l6 6 6-6" /></svg>);
export const IconStar = (p: P) => (<svg viewBox="0 0 40 40" aria-hidden {...p}><path d="M20 0C21.5 12 28 18.5 40 20 28 21.5 21.5 28 20 40 18.5 28 12 21.5 0 20 12 18.5 18.5 12 20 0Z" fill="#FFBC0D" /></svg>);

/* -------------------------------------------------------- Layout helpers */
export function Section({ children, className = "", tint = false, dark = false, id }: { children: ReactNode; className?: string; tint?: boolean; dark?: boolean; id?: string }) {
  return (
    <section id={id} className={`py-16 sm:py-20 lg:py-24 ${dark ? "bg-char text-white" : tint ? "bg-tint" : ""} ${className}`}>
      <div className="container-x">{children}</div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, lead, center = false, dark = false }: { eyebrow?: string; title: string; lead?: string; center?: boolean; dark?: boolean }) {
  return (
    <div className={`mb-10 max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className={`eyebrow ${dark ? "!text-gold" : ""}`}>{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h2>
      {lead && <p className={`mt-4 text-lg font-light leading-relaxed ${dark ? "text-g1" : "text-g3"}`}>{lead}</p>}
    </div>
  );
}

export function PageHero({ title, lead, eyebrow, children }: { title: string; lead?: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b border-g1 bg-white">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-10 h-72 w-[34rem] rounded-full bg-gold/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full border border-g1" />
      <div className="container-x relative py-14 sm:py-20">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">{title}</h1>
        {lead && <p className="mt-5 max-w-3xl text-lg font-light leading-relaxed text-g3 sm:text-xl">{lead}</p>}
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </div>
  );
}

export function CheckList({ items, className = "" }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {items.map((t) => (
        <li key={t} className="flex gap-3 text-g3">
          <span className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full bg-gold" aria-hidden />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function NumberedSteps({ items, dark = false }: { items: readonly string[]; dark?: boolean }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {items.map((t, i) => (
        <li key={t} className={`flex items-center gap-4 rounded-2xl border p-4 ${dark ? "border-g3 bg-g3/40" : "border-g1 bg-white"}`}>
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-char text-sm font-bold text-gold">{i + 1}</span>
          <span className="font-medium">{t}</span>
        </li>
      ))}
    </ol>
  );
}

export function LinkButton({ href, children, variant = "primary", className = "", arrow = false }: { href: string; children: ReactNode; variant?: "primary" | "gold" | "outline"; className?: string; arrow?: boolean }) {
  const v = variant === "gold" ? "btn-gold" : variant === "outline" ? "btn-outline" : "btn-primary";
  return (
    <Link href={href} className={`btn ${v} ${className}`}>
      {children}
      {arrow && <IconArrow className="h-5 w-5" />}
    </Link>
  );
}

export function InfoCard({ title, children, dark = false }: { title: string; children: ReactNode; dark?: boolean }) {
  return (
    <div className={`rounded-3xl p-6 ${dark ? "bg-char text-white" : "card"}`}>
      <h3 className={`text-lg font-bold ${dark ? "text-gold" : ""}`}>{title}</h3>
      <div className={`mt-3 ${dark ? "text-g1" : "text-g3"} leading-relaxed`}>{children}</div>
    </div>
  );
}

/** Verification / status chip using brand colours only (never shows "verified" unless told to). */
export function StatusChip({ tone, children }: { tone: "grey" | "gold" | "dark" | "danger"; children: ReactNode }) {
  const cls =
    tone === "dark" ? "bg-char text-white" : tone === "gold" ? "bg-gold text-char" : tone === "danger" ? "border border-danger text-danger bg-white" : "bg-g1 text-char";
  return <span className={`chip ${cls}`}>{children}</span>;
}
