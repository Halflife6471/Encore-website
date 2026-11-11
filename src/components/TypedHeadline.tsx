import type { CSSProperties } from "react";

/**
 * Typewriter headline, done entirely in CSS so it works with server rendering and without JavaScript.
 * - The real text stays in the DOM (screen readers get it once, via `sr-only`; the animated copy is aria-hidden).
 * - Words never break mid-word; long lines wrap naturally on phones.
 * - `prefers-reduced-motion` shows the finished headline instantly (see globals.css).
 */
export function TypedHeadline({
  lines,
  step = 65,
  start = 350,
  markLast = true,
}: {
  lines: readonly string[];
  /** Milliseconds per character. */
  step?: number;
  /** Delay before typing begins (ms). */
  start?: number;
  /** Highlight the final line with the brand-gold marker once typed. */
  markLast?: boolean;
}) {
  let i = 0;
  const total = lines.reduce((n, l) => n + l.length, 0);
  const done = start + total * step;
  const css = { "--step": `${step}ms`, "--start": `${start}ms`, "--done": `${done}ms` } as CSSProperties;

  return (
    <>
      <span className="sr-only">{lines.join(" ")}</span>
      <span aria-hidden className="block" style={css}>
        {lines.map((line, li) => {
          const last = li === lines.length - 1;
          const words = line.split(" ");
          const content = words.map((w, wi) => (
            <span key={wi} className="inline-block whitespace-nowrap">
              {[...w].map((ch) => {
                const idx = i++;
                const isEnd = idx === total - 1;
                return (
                  <span key={idx} className={`tc${isEnd ? " tc-end" : ""}`} style={{ "--i": idx } as CSSProperties}>
                    {ch}
                  </span>
                );
              })}
              {wi < words.length - 1 ? " " : ""}
            </span>
          ));
          i += 1; // the space/line break takes one beat
          return (
            <span key={li} className={`block ${last && markLast ? "font-bold italic" : ""}`}>
              {last && markLast ? <span className="typed-mark dark:text-gold">{content}</span> : content}
            </span>
          );
        })}
      </span>
    </>
  );
}
