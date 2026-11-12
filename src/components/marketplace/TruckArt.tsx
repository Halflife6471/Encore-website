import type { VehicleType } from "@/lib/marketplace";

/**
 * Side-view truck illustration per vehicle type. Uses theme tokens only (surface / fg / gold),
 * so it works in light and dark mode without extra assets.
 */
export function TruckArt({ type, className = "" }: { type: VehicleType; className?: string }) {
  const stroke = "stroke-fg";
  const body = `fill-surface ${stroke}`;
  const common = { strokeWidth: 2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

  let trailer: React.ReactNode;
  switch (type) {
    case "box":
      trailer = <rect x="10" y="16" width="124" height="40" rx="3" className={body} {...common} />;
      break;
    case "curtainside":
      trailer = (
        <>
          <rect x="10" y="16" width="124" height="40" rx="3" className={body} {...common} />
          {[30, 50, 70, 90, 110].map((x) => <path key={x} d={`M${x} 18V54`} className={stroke} strokeWidth={1.2} opacity={0.45} />)}
        </>
      );
      break;
    case "reefer":
      trailer = (
        <>
          <rect x="10" y="16" width="124" height="40" rx="3" className={body} {...common} />
          <rect x="120" y="20" width="10" height="14" rx="2" className="fill-gold stroke-fg" strokeWidth={1.5} />
          <path d="M20 36h86M20 42h86" className={stroke} strokeWidth={1.2} opacity={0.35} />
        </>
      );
      break;
    case "container":
      trailer = (
        <>
          <rect x="10" y="52" width="124" height="4" className={body} {...common} />
          <rect x="14" y="20" width="116" height="32" rx="2" className={body} {...common} />
          {[28, 42, 56, 70, 84, 98, 112].map((x) => <path key={x} d={`M${x} 22V50`} className={stroke} strokeWidth={1.4} opacity={0.5} />)}
        </>
      );
      break;
    case "flatbed":
      trailer = (
        <>
          <rect x="10" y="50" width="124" height="6" rx="1" className={body} {...common} />
          {[12, 134].map((x) => <path key={x} d={`M${x} 50V38`} className={stroke} strokeWidth={2} />)}
          <rect x="30" y="38" width="70" height="12" rx="2" className="fill-gold stroke-fg" strokeWidth={1.5} opacity={0.9} />
        </>
      );
      break;
    case "lowbed":
      trailer = (
        <>
          <path d="M8 40h20l6 14h98v5H34l-6-12H8z" className={body} {...common} />
          <rect x="52" y="22" width="52" height="32" rx="3" className="fill-gold stroke-fg" strokeWidth={1.5} />
          <path d="M60 22v-6h18v6" className={stroke} strokeWidth={2} fill="none" />
        </>
      );
      break;
    case "tipper":
      trailer = <path d="M10 56 L16 22 H116 L134 56 Z" className={body} {...common} />;
      break;
    case "bulk":
      trailer = (
        <>
          <path d="M10 22H134V38L112 56H32L10 38Z" className={body} {...common} />
          <path d="M22 22v4M60 22v4M98 22v4" className={stroke} strokeWidth={2} />
        </>
      );
      break;
    case "fuel_tanker":
    case "chem_tanker":
      trailer = (
        <>
          <rect x="10" y="20" width="124" height="36" rx="18" className={body} {...common} />
          {[44, 76, 104].map((x) => <path key={x} d={`M${x} 21V55`} className={stroke} strokeWidth={1.4} opacity={0.5} />)}
          {type === "chem_tanker" && <rect x="14" y="34" width="116" height="6" className="fill-gold" opacity={0.9} />}
          <path d="M60 20v-4h14v4" className={stroke} strokeWidth={2} fill="none" />
        </>
      );
      break;
  }

  return (
    <svg viewBox="0 0 200 80" role="img" aria-hidden className={className}>
      {/* road line */}
      <path d="M0 71h200" className="stroke-line" strokeWidth={2} />
      {/* chassis */}
      <rect x="8" y="55" width="182" height="5" rx="2" className="fill-fg" opacity={0.85} />
      {trailer}
      {/* cab */}
      <path d="M138 60V26a3 3 0 0 1 3-3h20a3 3 0 0 1 2.4 1.2L184 44v16z" className="fill-gold stroke-fg" {...common} />
      <path d="M146 28h14l12 14h-26z" className="fill-surface stroke-fg" strokeWidth={1.5} strokeLinejoin="round" />
      <rect x="186" y="52" width="4" height="6" rx="1" className="fill-fg" />
      {/* wheels */}
      {[34, 52, 70, 150, 172].map((x) => (
        <g key={x}>
          <circle cx={x} cy={63} r={7.5} className="fill-fg" />
          <circle cx={x} cy={63} r={2.6} className="fill-surface" />
        </g>
      ))}
    </svg>
  );
}
