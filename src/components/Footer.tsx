import Link from "next/link";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { href, type RouteKey } from "@/lib/routes";
import { CONTACT } from "@/lib/site";
import { Logo } from "./ui";
import { LanguageSwitch } from "./LanguageSwitch";

export function Footer({ locale, d }: { locale: Locale; d: Dict }) {
  const cols: { title: string; links: { key: RouteKey; label: string }[] }[] = [
    {
      title: d.footer.explore,
      links: [
        { key: "howItWorks", label: d.nav.howItWorks },
        { key: "corridors", label: d.nav.corridors },
        { key: "about", label: d.nav.about },
        { key: "faq", label: d.faq.title },
      ],
    },
    {
      title: d.footer.network,
      links: [
        { key: "cargoOwners", label: d.nav.cargoOwners },
        { key: "transporters", label: d.nav.transporters },
        { key: "drivers", label: d.nav.drivers },
        { key: "partners", label: d.nav.partners },
      ],
    },
    {
      title: d.footer.support,
      links: [
        { key: "contact", label: d.nav.contact },
        { key: "track", label: d.auth.track.title },
        { key: "login", label: d.nav.login },
        { key: "register", label: d.nav.getStarted },
      ],
    },
    {
      title: d.footer.legal,
      links: [
        { key: "privacy", label: d.legal.privacy.title },
        { key: "terms", label: d.legal.terms.title },
        { key: "staff", label: d.footer.staff },
      ],
    },
  ];

  return (
    <footer className="bg-char text-white">
      <div className="container-x py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo variant="reversed" className="h-14 w-auto" />
            <p className="mt-5 max-w-xs font-semibold text-gold">{d.meta.tagline}</p>
            <p className="mt-1 italic text-g1">{d.meta.slogan}</p>
            {(CONTACT.email || CONTACT.phone) && (
              <ul className="mt-5 space-y-1 text-sm text-g1">
                {CONTACT.phone && <li>{CONTACT.phone}</li>}
                {CONTACT.email && <li><a className="hover:text-white" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>}
              </ul>
            )}
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold">{c.title}</h3>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.key}>
                    <Link href={href(locale, l.key)} className="font-light text-g1 transition hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-g3 pt-6 text-sm text-g2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {d.meta.siteName}. {d.footer.copyright}</p>
          <div className="[&_a]:!text-g1 [&_div]:!border-g3 [&_a[aria-current=true]]:!bg-gold [&_a[aria-current=true]]:!text-char">
            <LanguageSwitch locale={locale} label={d.nav.language} />
          </div>
        </div>
      </div>
    </footer>
  );
}
