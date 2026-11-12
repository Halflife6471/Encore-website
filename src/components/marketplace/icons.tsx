import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", "aria-hidden": true } as const;

export const IconPin = (p: P) => (<svg {...base} {...p}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
export const IconCalendar = (p: P) => (<svg {...base} {...p}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>);
export const IconScale = (p: P) => (<svg {...base} {...p}><path d="M12 4v16M7 20h10M5 8h14M5 8l-3 7a3.5 3.5 0 0 0 6 0L5 8zM19 8l-3 7a3.5 3.5 0 0 0 6 0l-3-7z" /></svg>);
export const IconSearch = (p: P) => (<svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>);
export const IconStarSolid = (p: P) => (<svg viewBox="0 0 24 24" aria-hidden fill="currentColor" {...p}><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" /></svg>);
export const IconFilter = (p: P) => (<svg {...base} {...p}><path d="M3 5h18M6 12h12M10 19h4" /></svg>);
export const IconShield = (p: P) => (<svg {...base} {...p}><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5L15.5 10" /></svg>);
export const IconClock = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const IconFlag = (p: P) => (<svg {...base} {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>);
export const IconSnow = (p: P) => (<svg {...base} {...p}><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5" /></svg>);
export const IconAlert = (p: P) => (<svg {...base} {...p}><path d="M12 3l10 18H2L12 3z" /><path d="M12 10v5M12 18.2v.1" /></svg>);
export const IconInfo = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.1" /></svg>);
