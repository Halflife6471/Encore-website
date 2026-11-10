import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/supabase/env";
import { isLocale } from "@/lib/i18n-config";

/** Only same-site relative paths are allowed as post-login targets (prevents open redirects). */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/en/app";
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const first = next.split("/")[1];
  const locale = isLocale(first) ? first : "en";

  if (authConfigured()) {
    const supabase = await createClient();
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;

    let ok = false;
    if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
    else if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;

    if (ok) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL(`/${locale}/login?error=link_expired`, request.url));
}
