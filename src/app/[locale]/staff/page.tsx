import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { StaffLoginForm } from "@/components/forms/OtherForms";
import { getDict, isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "staff", d.auth.staff.title, d.auth.staff.subtitle, { noindex: true });
}

export default async function Staff({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  return (
    <AuthShell locale={locale} d={d} variant="login">
      <StaffLoginForm locale={locale} d={d} />
    </AuthShell>
  );
}
