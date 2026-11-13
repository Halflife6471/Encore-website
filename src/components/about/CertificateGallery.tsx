"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconArrow, IconClose } from "../ui";

export type Cert = { src: string; width: number; height: number; title: string; issuer: string; note: string };

const IconZoom = () => (
  <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5M11 8v6M8 11h6" />
  </svg>
);

/**
 * Framed certificate cards with a click-to-enlarge viewer (keyboard: Esc closes, ← → move between certificates).
 * The images are the official documents, shown unaltered.
 */
export function CertificateGallery({
  certs, labels,
}: {
  certs: Cert[];
  labels: { issuedBy: string; enlarge: string; close: string; prev: string; next: string };
}) {
  const [open, setOpen] = useState<number | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const show = (i: number, el?: HTMLElement | null) => {
    if (el) opener.current = el;
    setOpen(i);
  };
  const hide = useCallback(() => {
    setOpen(null);
    opener.current?.focus?.();
  }, []);
  const move = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + certs.length) % certs.length)), [certs.length]);

  useEffect(() => {
    if (open === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, hide, move]);

  const cur = open === null ? null : certs[open];

  return (
    <>
      <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {certs.map((c, i) => (
          <li key={c.src}>
            <button
              type="button"
              onClick={(e) => show(i, e.currentTarget)}
              aria-label={`${labels.enlarge}: ${c.title}`}
              className="group relative block w-full rounded-[1.75rem] border border-goldline bg-goldsoft p-3 text-left shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:-translate-y-1"
            >
              {/* the "paper" */}
              <span className="relative block overflow-hidden rounded-2xl border border-line bg-white shadow-[0_6px_22px_rgba(29,29,27,.14)]">
                <span className="relative block aspect-[3/4]">
                  <Image src={c.src} alt={c.title} fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw" className="object-cover object-top transition duration-500 group-hover:scale-[1.04]" />
                </span>
                <span aria-hidden className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-ink/80 to-transparent px-4 pb-3 pt-10 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  <IconZoom /> {labels.enlarge}
                </span>
              </span>
              <span className="mt-4 block px-2 pb-1">
                <span className="block text-lg font-bold leading-snug">{c.title}</span>
                <span className="mt-1 block text-sm text-muted">{c.note}</span>
                <span className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold">
                  <span aria-hidden className="h-2 w-2 flex-none rounded-full bg-gold" />
                  <span className="truncate">{labels.issuedBy} {c.issuer}</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {cur && open !== null && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-ink/90 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={cur.title} onClick={hide}>
          <div className="flex items-start justify-between gap-4 p-4 text-white sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold sm:text-xl">{cur.title}</p>
              <p className="truncate text-sm text-g1">{labels.issuedBy} {cur.issuer}</p>
            </div>
            <button ref={closeBtn} type="button" onClick={hide} aria-label={labels.close} className="grid h-11 w-11 flex-none place-items-center rounded-full border border-white/30 bg-white/10 transition hover:bg-white/20">
              <IconClose className="h-5 w-5" />
            </button>
          </div>
          <div className="relative min-h-0 flex-1 px-4 pb-4 sm:px-16 sm:pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="relative mx-auto h-full max-w-3xl">
              <Image key={cur.src} src={cur.src} alt={cur.title} fill sizes="90vw" className="rounded-xl bg-white object-contain shadow-lift" priority />
            </div>
            {certs.length > 1 && (
              <>
                <button type="button" onClick={() => move(-1)} aria-label={labels.prev} className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-ink/70 text-white transition hover:bg-ink sm:left-5">
                  <IconArrow className="h-5 w-5 rotate-180" />
                </button>
                <button type="button" onClick={() => move(1)} aria-label={labels.next} className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-ink/70 text-white transition hover:bg-ink sm:right-5">
                  <IconArrow className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
