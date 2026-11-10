"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { href, routeSlugs, type RouteKey } from "@/lib/routes";
import { CONTACT } from "@/lib/site";
import { IconArrow, IconChevron, IconClose, IconMenu, IconPhone, Logo } from "./ui";
import { LanguageSwitch } from "./LanguageSwitch";
import { ThemeToggle } from "./ThemeToggle";

/** Phone/tablet bar height. The full-screen menu starts exactly below it. */
const BAR = "68px";

export function Header({ locale, nav }: { locale: Locale; nav: Dict["nav"] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const on = () => setStuck(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  // Lock page scroll while the menu is open; close on Escape; close if the screen grows to desktop.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 1280px)");
    const onResize = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onResize);
    };
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
  const phone = CONTACT.phone;
  const tel = phone ? `tel:${phone.replace(/\s/g, "")}` : undefined;
  const pill = (on: boolean) =>
    `flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2.5 text-[15px] font-medium transition ${on ? "bg-surface text-fg shadow-[0_1px_4px_rgba(29,29,27,.12)]" : "text-muted hover:bg-surface/70 hover:text-fg"}`;

  const menuLinks: { key: RouteKey; label: string }[] = [
    { key: "howItWorks", label: nav.howItWorks },
    { key: "cargoOwners", label: nav.cargoOwners },
    { key: "transporters", label: nav.transporters },
    { key: "drivers", label: nav.drivers },
    { key: "corridors", label: nav.corridors },
    { key: "partners", label: nav.partners },
    { key: "about", label: nav.about },
    { key: "contact", label: nav.contact },
  ];

  return (
    <>
      <header className={`sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur transition-shadow ${stuck ? "shadow-soft" : ""}`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          {nav.skip}
        </a>
        <div className={`mx-auto flex w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 h-[68px] items-center justify-between gap-3 xl:transition-all ${stuck ? "xl:h-[72px]" : "xl:h-[84px]"}`}>
          <Link href={href(locale, "home")} aria-label="Encore Holdings Group — Home" className="min-w-0 flex-none">
            <Logo className={`h-8 w-auto min-[400px]:h-9 sm:h-10 xl:transition-all ${stuck ? "xl:h-10" : "xl:h-12"}`} />
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Main" className="hidden items-center gap-1 rounded-full bg-line/35 p-1.5 xl:flex">
            <Link href={href(locale, "howItWorks")} className={pill(active("howItWorks"))}>{nav.howItWorks}</Link>
            <div className="group relative">
              <button type="button" aria-haspopup="menu" className={pill(solutionsActive)}>
                {nav.solutions} <IconChevron className="h-3.5 w-3.5" />
              </button>
              <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div role="menu" className="min-w-56 rounded-2xl border border-line bg-surface p-2 shadow-lift">
                  {solutions.map((s) => (
                    <Link key={s.key} role="menuitem" href={href(locale, s.key)} className={`block rounded-xl px-4 py-2.5 text-[15px] font-medium hover:bg-soft ${active(s.key) ? "bg-goldsoft" : ""}`}>
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

          {/* Desktop actions */}
          <div className="hidden items-center gap-4 xl:flex min-[1440px]:gap-5">
            <ThemeToggle toDark={nav.themeDark} toLight={nav.themeLight} />
            <LanguageSwitch locale={locale} label={nav.language} />
            {phone && (
              <>
                <a href={tel} aria-label={`${nav.support}: ${phone}`} title={phone} className="hidden h-11 w-11 place-items-center rounded-full bg-goldsoft transition hover:bg-gold min-[1440px]:grid min-[1700px]:hidden">
                  <IconPhone className="h-5 w-5" />
                </a>
                <a href={tel} className="hidden items-center gap-3 min-[1700px]:flex">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-goldsoft"><IconPhone className="h-5 w-5" /></span>
                  <span className="leading-tight">
                    <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{nav.support}</span>
                    <span className="block whitespace-nowrap text-[17px] font-semibold">{phone}</span>
                  </span>
                </a>
              </>
            )}
            <Link href={href(locale, "login")} className="group/login flex items-center gap-2 border-b-2 border-gold pb-0.5 font-semibold">
              {nav.login}
              <IconArrow className="h-[18px] w-[18px] transition-transform group-hover/login:translate-x-1" />
            </Link>
          </div>

          {/* Phone / tablet actions */}
          <div className="flex items-center gap-2 xl:hidden">
            <ThemeToggle toDark={nav.themeDark} toLight={nav.themeLight} />
            <div className="hidden sm:block"><LanguageSwitch locale={locale} label={nav.language} /></div>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? nav.close : nav.menu}
              className="grid h-11 w-11 flex-none place-items-center rounded-full border border-line bg-surface text-fg transition active:scale-95"
            >
              {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/*
        The menu lives OUTSIDE <header>: the header has backdrop-filter, which would otherwise become the
        containing block of this fixed panel and squash it to the header's height.
      */}
      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={nav.menu}
          style={{ top: BAR, height: `calc(100dvh - ${BAR})` }}
          className="fixed inset-x-0 z-[45] overflow-y-auto overscroll-contain bg-page xl:hidden"
        >
          <div className="container-x pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
            <nav aria-label="Mobile">
              <ul className="space-y-1">
                {menuLinks.map((l, i) => (
                  <li key={l.key}>
                    <Link
                      ref={i === 0 ? firstLink : undefined}
                      href={href(locale, l.key)}
                      aria-current={active(l.key) ? "page" : undefined}
                      className={`flex min-h-[52px] items-center justify-between rounded-2xl px-4 text-xl font-semibold transition ${active(l.key) ? "bg-goldsoft" : "hover:bg-soft active:bg-soft"}`}
                    >
                      {l.label}
                      <IconArrow className="h-5 w-5 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link href={href(locale, "login")} className="btn btn-outline">{nav.login}</Link>
              <Link href={href(locale, "register")} className="btn btn-gold">{nav.getStarted}</Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-soft p-4">
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{nav.language}</p>
                <LanguageSwitch locale={locale} label={nav.language} />
              </div>
              {phone && (
                <a href={tel} className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-goldsoft"><IconPhone className="h-5 w-5" /></span>
                  <span className="leading-tight">
                    <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{nav.support}</span>
                    <span className="block whitespace-nowrap font-semibold">{phone}</span>
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
