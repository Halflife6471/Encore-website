"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "./ui";

const KEY = "enc_theme";

/**
 * Light / dark switch. The inline script in the layout applies the saved (or system) theme before paint;
 * this button flips it and remembers the choice. Icons switch with CSS so there is no hydration flicker.
 */
export function ThemeToggle({ toDark, toLight }: { toDark: string; toLight: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    setDark(el.dataset.theme === "dark");
    // Follow the operating system until the visitor makes an explicit choice.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = (e: MediaQueryListEvent) => {
      try { if (localStorage.getItem(KEY)) return; } catch { /* storage unavailable */ }
      el.dataset.theme = e.matches ? "dark" : "light";
      setDark(e.matches);
    };
    mq.addEventListener("change", onSystem);
    return () => mq.removeEventListener("change", onSystem);
  }, []);

  const toggle = () => {
    const el = document.documentElement;
    const next = el.dataset.theme === "dark" ? "light" : "dark";
    el.dataset.theme = next;
    setDark(next === "dark");
    try { localStorage.setItem(KEY, next); } catch { /* storage unavailable */ }
  };

  const label = dark ? toLight : toDark;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="group/theme grid h-10 w-10 flex-none place-items-center rounded-full border border-line text-fg transition hover:border-gold hover:bg-goldsoft"
    >
      <IconMoon className="h-[18px] w-[18px] transition group-hover/theme:-rotate-12 dark:hidden" />
      <IconSun className="hidden h-[18px] w-[18px] text-gold transition group-hover/theme:rotate-45 dark:block" />
    </button>
  );
}
