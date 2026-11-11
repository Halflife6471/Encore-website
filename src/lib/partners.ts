/**
 * Partner and association logos shown in the home-page marquee.
 *
 * - Logos belong to the respective organisations; Encore must hold permission to display them.
 * - `logo` is optional: partners without a supplied logo file appear as a name-only pill.
 *   To add one, drop a PNG into /public/partners and set `logo` below – nothing else changes.
 */
export type Partner = {
  /** Short label printed in the pill (CargoLink-style). */
  label: string;
  /** Full name, used as alt text. */
  name: string;
  logo?: { src: string; width: number; height: number };
};

export const PARTNERS: Partner[] = [
  { label: "TISEZA", name: "TISEZA – Tanzania Investment and Special Economic Zones Authority", logo: { src: "/partners/tiseza.png", width: 411, height: 412 } },
  { label: "LATRA", name: "LATRA – Land Transport Regulatory Authority", logo: { src: "/partners/latra.png", width: 480, height: 234 } },
  { label: "TRA", name: "TRA – Tanzania Revenue Authority", logo: { src: "/partners/tra.png", width: 208, height: 242 } },
  { label: "NAVALIS MARITIME AGENCY", name: "Navalis Maritime Agency" },
  { label: "TAFFA", name: "TAFFA – Tanzania Freight Forwarders Association", logo: { src: "/partners/taffa.png", width: 295, height: 107 } },
  { label: "TASAC", name: "TASAC – Tanzania Shipping Agencies Corporation", logo: { src: "/partners/tasac.png", width: 157, height: 128 } },
  { label: "SECURE LOGISTICS", name: "Secure Logistics (T) Ltd", logo: { src: "/partners/secure-logistics.png", width: 196, height: 132 } },
  { label: "TATOA", name: "TATOA – Tanzania Truck Owners Association", logo: { src: "/partners/tatoa.png", width: 480, height: 174 } },
  { label: "KATABARO LOGISTICS", name: "Katabaro Logistics" },
  { label: "CCTTFA", name: "CCTTFA – Central Corridor Transit Transport Facilitation Agency", logo: { src: "/partners/ccttfa.png", width: 327, height: 248 } },
  { label: "TPA", name: "TPA – Tanzania Ports Authority", logo: { src: "/partners/tpa.png", width: 414, height: 258 } },
  { label: "MWEMBE LOGISTICS", name: "Mwembe Logistics Co. Limited", logo: { src: "/partners/mwembe-logistics.png", width: 335, height: 225 } },
  { label: "TOPNOTCH", name: "Topnotch Co. Limited", logo: { src: "/partners/topnotch.png", width: 480, height: 193 } },
  { label: "JACTRANS", name: "JACTrans" },
  { label: "SINOTRANS", name: "Sinotrans", logo: { src: "/partners/sinotrans.png", width: 230, height: 219 } },
  { label: "DONITO FREIGHT FORWARDERS", name: "Donito Freight Forwarders" },
  { label: "GLA", name: "Global Logistics Alliance (GLA)" },
];
