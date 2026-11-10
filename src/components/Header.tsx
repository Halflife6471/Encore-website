"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { href, routeSlugs, type RouteKey } from "@/lib/routes";
import { CONTACT, SHOW_PLACEHOLDERS } from "@/lib/site";
import { IconArrow, IconChevron, IconClose, IconMenu, IconPhone, Logo } from "./ui";
import { LanguageSwitch } from "./LanguageSwitch";

export function Header({ locale, nav }: { locale: Locale; nav: Dict["nav"] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const on = () => setStuck(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const active = (key: RouteKey) => {
    const slug = routeSlugs[key][locale];
    return !!slug && (pathname === `/${locale}/${slug}` || pathname.startsWith(`/${locale}/${slug}/`));
  };
  const solutions: { key: RouteKey; label: string }[] = [
    { key: "cargoOwners", label: nav.cargoOwners },
    { key: "transporters", label: nav.transporters },
    { key: "drivers", label: nav.drivers },
  ];
  const solutionsActive = solutions.some((s) => active(s.key));
  const phone = CONTACT.phone || (SHOW_PLACEHOLDERS ? "+255 XXX XXX XXX" : "");
  const pill = (on: boolean) =>
    `flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-[15px] font-medium transition ${on ? "bg-white text-char shadow-[0_1px_4px_rgba(29,29,27,.12)]" : "text-g3 hover:bg-white/70 hover:text-char"}`;

  return (
    <header className={`sticky top-0 z-40 border-b border-g1 bg-white/95 backdrop-blur transition-shadow ${stuck ? "shadow-soft" : ""}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-char focus:px-4 focus:py-2 focus:text-white">
        {nav.skip}
      </a>
      <div className={`container-x flex items-center justify-between gap-4 transition-all ${stuck ? "h-[72px]" : "h-[84px]"}`}>
        <Link href={href(locale, "home")} aria-label="Encore Holdings Group — Home" className="flex-none">
          <Logo className={`w-auto transition-all ${stuck ? "h-10" : "h-12"}`} />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 rounded-full bg-g1/35 p-1.5 lg:flex">
          <Link href={href(locale, "howItWorks")} className={pill(active("howItWorks"))}>{nav.howItWorks}</Link>
          <div className="group relative">
            <button type="button" aria-haspopup="menu" className={pill(solutionsActive)}>
              {nav.solutions} <IconChevron className="h-3.5 w-3.5" />
            </button>
            <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div role="menu" className="min-w-56 rounded-2xl border border-g1 bg-white p-2 shadow-lift">
                {solutions.map((s) => (
                  <Link key={s.key} role="menuitem" href={href(locale, s.key)} className={`block rounded-xl px-4 py-2.5 text-[15px] font-medium hover:bg-tint ${active(s.key) ? "bg-goldtint" : ""}`}>
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link href={href(locale, "corridors")} className={pill(active("corridors"))}>{nav.corridors}</Link>
          <Link href={href(locale, "partners")} className={pill(active("partners"))}>{nav.partners}</Link>
          <Link href={href(locale, "about")} className={pill(active("about"))}>{nav.about}</Link>
          <Link href={href(locale, "contact")} className={pill(active("contact"))}>{nav.contact}</Link>
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <LanguageSwitch locale={locale} label={nav.language} />
          {phone && (
            <a href={CONTACT.phone ? `tel:${CONTACT.phone.replace(/\s/g, "")}` : undefined} className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-goldtint"><IconPhone className="h-5 w-5" /></span>
              <span className="leading-tight">
                <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-g3">{nav.support}</span>
                <span className="block text-[17px] font-semibold">{phone}</span>
              </span>
            </a>
          )}
          <Link href={href(locale, "login")} className="group/login flex items-center gap-2 border-b-2 border-gold pb-0.5 font-semibold">
            {nav.login}
            <IconArrow className="h-[18px] w-[18px] transition-transform group-hover/login:translate-x-1" />
          </Link>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <LanguageSwitch locale={locale} label={nav.language} />
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? nav.close : nav.menu} className="grid h-11 w-11 place-items-center rounded-full border border-g1">
            {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-[72px] z-30 overflow-y-auto bg-white lg:hidden">
          <nav aria-label="Mobile" className="container-x flex flex-col gap-1 py-6">
            {[
              { key: "howItWorks", label: nav.howItWorks },
              { key: "cargoOwners", label: nav.cargoOwners },
              { key: "transporters", label: nav.transporters },
              { key: "drivers", label: nav.drivers },
              { key: "corridors", label: nav.corridors },
              { key: "partners", label: nav.partners },
              { key: "about", label: nav.about },
              { key: "contact", label: nav.contact },
            ].map((l) => (
              <Link key={l.key} href={href(locale, l.key as RouteKey)} className={`rounded-2xl px-4 py-3.5 text-xl font-semibold ${active(l.key as RouteKey) ? "bg-goldtint" : "hover:bg-tint"}`}>
                {l.label}
              </Link>
            ))}
            {phone && (
              <a href={CONTACT.phone ? `tel:${CONTACT.phone.replace(/\s/g, "")}` : undefined} className="mt-4 flex items-center gap-3 rounded-2xl bg-tint px-4 py-3.5">
                <IconPhone className="h-5 w-5" />
                <span><span className="block text-[11px] uppercase tracking-[0.18em] text-g3">{nav.support}</span><span className="font-semibold">{phone}</span></span>
              </a>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href={href(locale, "login")} className="btn btn-outline">{nav.login}</Link>
              <Link href={href(locale, "register")} className="btn btn-gold">{nav.getStarted}</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
