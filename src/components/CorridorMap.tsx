import type { Dict } from "@/lib/dictionaries/en";

/** Corridor graphic (SRD Fig 6.4). Zambia = core pilot; DRC expands with verified capacity; others planned. */
export function CorridorMap({ d }: { d: Dict["corridors"] }) {
  const [zm, cd, planned] = d.cards;
  return (
    <svg viewBox="0 0 700 232" role="img" aria-label={`${zm.t}, ${cd.t}`} className="h-auto w-full rounded-3xl bg-tint">
      <path d="M86 118C160 118 210 62 288 62" stroke="#FFBC0D" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M86 118C160 118 210 176 288 176" stroke="#3D4348" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="1 10" />
      <path d="M308 62L464 30M308 62H464M308 62L464 94" stroke="#FFBC0D" strokeWidth="2.5" fill="none" />
      <path d="M308 176L464 150M308 176L464 202" stroke="#3D4348" strokeWidth="2" fill="none" strokeDasharray="3 6" />
      <circle cx="72" cy="118" r="16" fill="#1D1D1B" /><circle cx="72" cy="118" r="6" fill="#FFBC0D" />
      <text x="72" y="152" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1D1D1B">Dar es Salaam</text>
      <circle cx="298" cy="62" r="11" fill="#FFBC0D" stroke="#1D1D1B" strokeWidth="2" />
      <text x="298" y="38" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1D1D1B">Lusaka</text>
      <rect x="248" y="78" width="100" height="20" rx="10" fill="#1D1D1B" />
      <text x="298" y="92" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#FFBC0D" letterSpacing=".8">{zm.status.toUpperCase()}</text>
      <circle cx="298" cy="176" r="11" fill="#fff" stroke="#3D4348" strokeWidth="3" />
      <text x="298" y="152" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1D1D1B">Lubumbashi</text>
      <rect x="248" y="192" width="100" height="20" rx="10" fill="#3D4348" />
      <text x="298" y="206" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff" letterSpacing=".8">{cd.status.toUpperCase()}</text>
      <g fontSize="12.5" fontWeight="600" fill="#1D1D1B">
        <circle cx="470" cy="30" r="6" fill="#1D1D1B" /><text x="484" y="34">Ndola</text>
        <circle cx="470" cy="62" r="6" fill="#1D1D1B" /><text x="484" y="66">Kitwe</text>
        <circle cx="470" cy="94" r="6" fill="#1D1D1B" /><text x="484" y="98">Chingola</text>
        <circle cx="470" cy="150" r="6" fill="#3D4348" /><text x="484" y="154">Likasi</text>
        <circle cx="470" cy="202" r="6" fill="#3D4348" /><text x="484" y="206">Kolwezi</text>
      </g>
      <rect x="578" y="30" width="108" height="84" rx="12" fill="#1D1D1B" />
      <text x="590" y="52" fontSize="10" fontWeight="700" fill="#FFBC0D" letterSpacing="1">{planned.status.toUpperCase()}</text>
      <g fontSize="12" fontWeight="600" fill="#fff"><text x="590" y="72">Malawi</text><text x="590" y="90">Rwanda</text><text x="590" y="108">Burundi</text></g>
    </svg>
  );
}
