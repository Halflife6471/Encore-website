import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", "aria-hidden": true } as const;

export const IconClipboard = (p: P) => (<svg {...base} {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9zM8.5 12l2 2 4-4.5M8.5 17.5h7" /></svg>);
export const IconWarehouse = (p: P) => (<svg {...base} {...p}><path d="M3 10l9-6 9 6v10H3zM7 20v-7h10v7M7 16.5h10" /></svg>);
export const IconNetwork = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="18" r="2.5" /><circle cx="19" cy="18" r="2.5" /><path d="M10.7 7.2L6.3 15.8M13.3 7.2l4.4 8.6M7.5 18h9" /></svg>);
export const IconBriefcase = (p: P) => (<svg {...base} {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18" /></svg>);
