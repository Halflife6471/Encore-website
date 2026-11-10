import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n-config";
import { canonicalSlug } from "@/lib/routes";
import { REFERRAL_COOKIE, REFERRAL_WINDOW_DAYS } from "@/lib/site";
import { authConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

const SESSION_ONLY_COOKIE = "enc_so";

function pickLocale(req: NextRequest): Locale {
  const saved = req.cookies.get("enc_locale")?.value;
  if (isLocale(saved)) return saved;
  const al = req.headers.get("accept-language")?.toLowerCase() ?? "";
  return al.startsWith("sw") ? "sw" : DEFAULT_LOCALE;
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);

  // 1. Every page lives under /en or /sw.
  if (!segments.length || !isLocale(segments[0])) {
    const url = request.nextUrl.clone();
    url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }
  const locale = segments[0];

  // 2. Localised Swahili slugs map to the canonical (English) route folders.
  let rewriteUrl: URL | null = null;
  const [, second, ...rest] = segments;
  if (second) {
    const canon = canonicalSlug(second);
    if (canon && canon !== second) {
      rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/${locale}/${canon}${rest.length ? "/" + rest.join("/") : ""}`;
    }
  }
  const build = () => (rewriteUrl ? NextResponse.rewrite(rewriteUrl, { request }) : NextResponse.next({ request }));
  let response = build();

  // 3. Keep the Supabase session fresh (only when a session cookie exists).
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (authConfigured() && hasSession) {
    const sessionOnly = request.cookies.get(SESSION_ONLY_COOKIE)?.value === "1";
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = build();
          list.forEach(({ name, value, options }) => {
            const o = sessionOnly ? { ...options, maxAge: undefined, expires: undefined } : options;
            response.cookies.set(name, value, o);
          });
        },
      },
    });
    await supabase.auth.getUser();
  }

  // 4. Referral attribution: remember a valid ?ref=CODE for 60 days (SRS §21.6).
  const ref = searchParams.get("ref")?.trim().toUpperCase();
  if (ref && /^[A-Z0-9-]{4,24}$/.test(ref)) {
    response.cookies.set(REFERRAL_COOKIE, ref, {
      maxAge: REFERRAL_WINDOW_DAYS * 86_400,
      sameSite: "lax",
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  response.cookies.set("enc_locale", locale, { maxAge: 365 * 86_400, sameSite: "lax", path: "/" });
  return response;
}

export const config = {
  matcher: ["/((?!_next/|api/|auth/|brand/|.*\\..*).*)"],
};
