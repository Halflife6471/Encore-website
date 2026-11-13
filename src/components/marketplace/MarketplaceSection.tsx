import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { getMarketplace } from "@/lib/marketplace-data";
import { appPath, href } from "@/lib/routes";
import { CONTACT } from "@/lib/site";
import { LinkButton, Section, SectionHead } from "../ui";
import { IconInfo } from "./icons";
import { MarketplaceBrowser } from "./MarketplaceBrowser";

/**
 * Live marketplace listings embedded in a page, locked to one kind: trucks for cargo owners, loads for transporters.
 * Same data, filters and detail view as /marketplace (company details stay hidden until verified).
 */
export async function MarketplaceSection({
  locale, d, focus, title, lead, cta,
}: {
  locale: Locale; d: Dict; focus: "truck" | "load"; title: string; lead: string; cta: string;
}) {
  const { listings, tier, base } = await getMarketplace();
  const hasSamples = listings.some((l) => l.isSample);
  return (
    <Section tint id={focus === "truck" ? "trucks" : "loads"} className="scroll-mt-20 !py-12 sm:!py-16">
      <SectionHead eyebrow={d.marketplace.eyebrow} title={title} lead={lead} />
      {hasSamples && (
        <p className="mb-6 flex gap-2.5 rounded-2xl border border-goldline bg-goldsoft p-3.5 text-sm" role="note">
          <IconInfo className="mt-0.5 h-4 w-4 flex-none" />
          <span><b>{d.marketplace.sampleBanner}.</b> {d.marketplace.sampleText}</span>
        </p>
      )}
      <MarketplaceBrowser
        d={d.marketplace}
        locale={locale}
        base={base}
        focus={focus}
        listings={listings}
        tier={tier}
        links={{ login: href(locale, "login"), register: href(locale, "register"), app: href(locale, "app"), whatsapp: CONTACT.whatsapp }}
      />
      <div className="mt-10 flex flex-wrap gap-3">
        <LinkButton href={href(locale, "marketplace")} variant="primary" arrow>{cta}</LinkButton>
        {tier !== "guest" ? null : <LinkButton href={href(locale, "register")} variant="gold">{d.common.createAccount}</LinkButton>}
      </div>
    </Section>
  );
}
