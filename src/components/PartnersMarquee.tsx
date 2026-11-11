import Image from "next/image";
import { PARTNERS } from "@/lib/partners";

/**
 * Horizontally scrolling partner strip (modelled on the CargoLink pattern the client asked for):
 * glass-style pills with a small logo + name, an endless left-moving loop, soft fades at both edges,
 * grayscale logos that turn to colour on hover, pause on hover, and a static scroll row for reduced motion.
 */
export function PartnersMarquee({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <section aria-label={title} className="border-b border-line bg-page">
      <div className="container-x pt-10 text-center">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="sr-only">{title}</h2>
      </div>
      <div className="marquee-viewport relative overflow-hidden py-8">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-page to-transparent sm:w-48" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-page to-transparent sm:w-48" />
        <div className="marquee-track flex w-max">
          {[0, 1].map((g) => (
            <ul key={g} aria-hidden={g === 1 ? true : undefined} className={`flex shrink-0 items-center gap-4 pr-4 ${g === 1 ? "marquee-dup" : ""}`}>
              {PARTNERS.map((p) => (
                <li key={p.label} className="client-logo shrink-0">
                  <div className="partner-pill flex items-center gap-3 px-4 py-2">
                    {p.logo && (
                      <Image
                        src={p.logo.src}
                        alt={g === 0 ? p.name : ""}
                        width={p.logo.width}
                        height={p.logo.height}
                        sizes="120px"
                        className="partner-img h-6 w-auto object-contain sm:h-7"
                      />
                    )}
                    <span className="partner-label whitespace-nowrap text-sm font-black tracking-wide sm:text-base">{p.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
