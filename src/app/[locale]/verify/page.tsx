import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { ResendForm } from "@/components/forms/ResendForm";
import { IconMail, LinkButton } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";

type P = { params: Promise<{ locale: string }>; searchParams: Promise<{ email?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "verify", d.auth.verify.title, d.auth.verify.text, { noindex: true });
}

export default async function Verify({ params, searchParams }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const { email } = await searchParams;
  const valid = email && /^\S+@\S+\.\S+$/.test(email) ? email : undefined;
  return (
    <AuthShell locale={locale} d={d} variant="register">
      <div className="rounded-3xl border border-g1 p-8 shadow-soft">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-gold"><IconMail className="h-7 w-7" /></span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">{d.auth.verify.title}</h1>
        <p className="mt-3 text-g3">{d.auth.verify.text}</p>
        {valid && <ResendForm email={valid} locale={locale} d={d} />}
        <div className="mt-6"><LinkButton href={href(locale, "login")} variant="outline" className="btn-sm">{d.auth.verify.goLogin}</LinkButton></div>
      </div>
    </AuthShell>
  );
}
