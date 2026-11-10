import type { Dict } from "@/lib/dictionaries/en";

/**
 * Corridor graphic (SRD Fig 6.4). Zambia = core pilot; DRC expands with verified capacity; others planned.
 * Colours come from theme tokens so every label stays readable in light and dark mode.
 */
export function CorridorMap({ d }: { d: Dict["corridors"] }) {
  const [zm, cd, planned] = d.cards;
  return (
    <svg viewBox="0 0 700 232" role="img" aria-label={`${zm.t}, ${cd.t}`} className="h-auto w-full rounded-3xl bg-soft">
      <path d="M86 118C160 118 210 62 288 62" className="stroke-gold" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M86 118C160 118 210 176 288 176" className="stroke-muted" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="1 10" />
      <path d="M308 62L464 30M308 62H464M308 62L464 94" className="stroke-gold" strokeWidth="2.5" fill="none" />
      <path d="M308 176L464 150M308 176L464 202" className="stroke-muted" strokeWidth="2" fill="none" strokeDasharray="3 6" />
      <circle cx="72" cy="118" r="16" className="fill-fg" /><circle cx="72" cy="118" r="6" className="fill-gold" />
      <text x="72" y="152" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-fg">Dar es Salaam</text>
      <text x="72" y="167" textAnchor="middle" fontSize="10" className="fill-muted">Port hub · Tanzania</text>
      <circle cx="298" cy="62" r="11" className="fill-gold stroke-fg" strokeWidth="2" />
      <text x="298" y="38" textAnchor="middle" fontSize="14" fontWeight="700" className="fill-fg">Lusaka</text>
      <rect x="248" y="78" width="100" height="20" rx="10" className="fill-ink" />
      <text x="298" y="92" textAnchor="middle" fontSize="9.5" fontWeight="700" className="fill-gold" letterSpacing=".8">{zm.status.toUpperCase()}</text>
      <circle cx="298" cy="176" r="11" className="fill-surface stroke-muted" strokeWidth="3" />
      <text x="298" y="152" textAnchor="middle" fontSize="14" fontWeight="700" className="fill-fg">Lubumbashi</text>
      <rect x="248" y="192" width="100" height="20" rx="10" className="fill-g3" />
      <text x="298" y="206" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff" letterSpacing=".8">{cd.status.toUpperCase()}</text>
      <g fontSize="12.5" fontWeight="600" className="fill-fg">
        <circle cx="470" cy="30" r="6" className="fill-fg" /><text x="484" y="34">Ndola</text>
        <circle cx="470" cy="62" r="6" className="fill-fg" /><text x="484" y="66">Kitwe</text>
        <circle cx="470" cy="94" r="6" className="fill-fg" /><text x="484" y="98">Chingola</text>
        <circle cx="470" cy="150" r="6" className="fill-muted" /><text x="484" y="154">Likasi</text>
        <circle cx="470" cy="202" r="6" className="fill-muted" /><text x="484" y="206">Kolwezi</text>
      </g>
      <text x="484" y="18" fontSize="10" className="fill-muted">ZAMBIA</text>
      <text x="484" y="132" fontSize="10" className="fill-muted">DR CONGO</text>
      <rect x="578" y="30" width="108" height="84" rx="12" className="fill-ink" />
      <text x="590" y="52" fontSize="10" fontWeight="700" className="fill-gold" letterSpacing="1">{planned.status.toUpperCase()}</text>
      <g fontSize="12" fontWeight="600" fill="#fff"><text x="590" y="72">Malawi</text><text x="590" y="90">Rwanda</text><text x="590" y="108">Burundi</text></g>
    </svg>
  );
}
