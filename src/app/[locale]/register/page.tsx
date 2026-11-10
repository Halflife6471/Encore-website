import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { getDict, isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { REFERRAL_COOKIE } from "@/lib/site";

type P = { params: Promise<{ locale: string }>; searchParams: Promise<{ ref?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "register", d.auth.register.title, d.auth.register.subtitle);
}

export default async function Register({ params, searchParams }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const sp = await searchParams;
  // A valid ?ref= is stored for 60 days by the proxy; the form is pre-filled from it (SRS §21.6).
  const fromQuery = sp.ref?.trim().toUpperCase();
  const stored = (await cookies()).get(REFERRAL_COOKIE)?.value;
  const candidate = fromQuery || stored;
  const referral = candidate && /^[A-Z0-9-]{4,24}$/.test(candidate) ? candidate : undefined;
  return (
    <AuthShell locale={locale} d={d} variant="register">
      <RegisterForm locale={locale} d={d} referral={referral} />
    </AuthShell>
  );
}
