import type { ReactNode } from "react";
import type { Dict } from "@/lib/dictionaries/en";
import type { Locale } from "@/lib/i18n-config";
import { IconLock, IconMail } from "./ui";

/** Split-screen layout used by sign-in, sign-up, reset and staff sign-in (SRD §7). */
export function AuthShell({
  locale,
  d,
  variant,
  children,
}: {
  locale: Locale;
  d: Dict;
  variant: "login" | "register";
  children: ReactNode;
}) {
  const s = d.auth.scene;
  const gold = variant === "login" ? s.loginGold : s.registerGold;
  const dark = variant === "login" ? s.loginDark : s.registerDark;
  return (
    <div className="min-h-[calc(100vh-84px)] bg-white">
      <div className="h-1.5 bg-gold lg:hidden" />
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,600px)_1fr] lg:gap-14 lg:px-10 lg:py-10">
        <div className="flex flex-col">
          {children}
        </div>

        <aside aria-hidden className="relative hidden min-h-[640px] overflow-hidden rounded-[44px] bg-gradient-to-br from-tint via-[#e6e7e8] to-g1 lg:block">
          <Scene />
          <div className="absolute left-[11%] right-[12%] top-[9%] z-20 rounded-[22px] bg-gold p-5 shadow-lift">
            <span className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-char" />
            <p className="text-lg font-semibold">{gold.t}</p>
            <p className="mt-1 text-[15px] leading-snug">{gold.d}</p>
          </div>
          <div className="absolute left-[20%] right-[6%] top-[25%] z-10 rounded-[22px] bg-g3 p-5 pt-12 text-[15px] leading-snug text-white">
            <span className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-gold" />
            {dark}
          </div>
          <div className="absolute inset-x-[10%] bottom-[7%] z-20 rounded-[22px] border border-white/70 bg-white/55 p-5 shadow-lift backdrop-blur-xl">
            {variant === "login" ? (
              <>
                <div className="flex items-center justify-between font-semibold"><span className="text-lg">{s.quick}</span><span className="text-[13px] font-medium">{s.secure}</span></div>
                {[IconMail, IconLock].map((Ic, i) => (
                  <div key={i} className="mt-3.5 flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70"><Ic className="h-4 w-4" /></span>
                    <span className="h-2 flex-1 rounded-full bg-char/15" />
                  </div>
                ))}
                <div className="mt-4 h-10 rounded-xl bg-char/20" />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between font-semibold"><span className="text-lg">{d.auth.register.onboardingTitle}</span><span className="text-[13px] font-medium">{s.stepsCount}</span></div>
                <ol className="mt-3 space-y-2 text-[15px]">
                  {d.auth.register.steps.map((t, i) => (
                    <li key={t} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-char text-xs font-bold text-gold">{i + 1}</span>{t}</li>
                  ))}
                </ol>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Encore-owned illustration in brand colours: gold cab, charcoal road, light skyline. */
function Scene() {
  return (
    <svg viewBox="0 0 536 780" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <g fill="#fff" opacity=".55"><rect x="30" y="300" width="90" height="190" rx="10" /><rect x="130" y="340" width="70" height="150" rx="10" /><rect x="380" y="270" width="110" height="220" rx="10" /><rect x="300" y="330" width="70" height="160" rx="10" /></g>
      <g fill="#fff" opacity=".8"><rect x="45" y="330" width="14" height="14" rx="3" /><rect x="70" y="330" width="14" height="14" rx="3" /><rect x="45" y="360" width="14" height="14" rx="3" /><rect x="70" y="360" width="14" height="14" rx="3" /><rect x="400" y="300" width="16" height="16" rx="3" /><rect x="430" y="300" width="16" height="16" rx="3" /><rect x="400" y="334" width="16" height="16" rx="3" /><rect x="430" y="334" width="16" height="16" rx="3" /></g>
      <polygon points="0,500 536,400 536,650 0,750" fill="#3D4348" />
      <polygon points="0,500 536,400 536,412 0,512" fill="#FFBC0D" />
      <line x1="0" y1="628" x2="536" y2="526" stroke="#fff" strokeWidth="5" strokeDasharray="46 34" opacity=".9" />
      <g transform="translate(70 282) rotate(-10 200 150)">
        <ellipse cx="205" cy="262" rx="215" ry="16" fill="#1D1D1B" opacity=".22" />
        <rect x="0" y="40" width="300" height="170" rx="12" fill="#fff" stroke="#D1D3D4" strokeWidth="2" />
        <rect x="0" y="150" width="300" height="22" fill="#FFBC0D" />
        <rect x="0" y="172" width="300" height="38" fill="#F3F4F4" />
        <g fill="#1D1D1B"><rect x="26" y="78" width="120" height="14" rx="3" /><rect x="26" y="102" width="82" height="14" rx="3" /></g>
        <circle cx="260" cy="88" r="22" fill="#FFBC0D" /><path d="M252 92c4 6 12 6 16 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M306 78h58a22 22 0 0 1 20 13l24 54a24 24 0 0 1 2 10v55H306z" fill="#FFBC0D" />
        <path d="M322 94h38a14 14 0 0 1 13 9l15 34h-66z" fill="#F3F4F4" stroke="#1D1D1B" strokeOpacity=".15" />
        <rect x="384" y="190" width="30" height="8" rx="4" fill="#1D1D1B" />
        <rect x="0" y="206" width="414" height="22" rx="6" fill="#1D1D1B" />
        <g fill="#1D1D1B"><circle cx="70" cy="232" r="30" /><circle cx="140" cy="232" r="30" /><circle cx="350" cy="232" r="30" /></g>
        <g fill="#D1D3D4"><circle cx="70" cy="232" r="13" /><circle cx="140" cy="232" r="13" /><circle cx="350" cy="232" r="13" /></g>
        <g fill="#FFBC0D"><circle cx="70" cy="232" r="5" /><circle cx="140" cy="232" r="5" /><circle cx="350" cy="232" r="5" /></g>
      </g>
    </svg>
  );
}
