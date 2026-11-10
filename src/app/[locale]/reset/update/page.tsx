import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { NewPasswordForm } from "@/components/forms/OtherForms";
import { getDict, isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { authConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type P = { params: Promise<{ locale: string }>; searchParams: Promise<{ first?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "reset", d.auth.reset.newTitle, d.auth.reset.subtitle, { noindex: true });
}

export default async function UpdatePassword({ params, searchParams }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const sp = await searchParams;
  // A recovery link (or a staff first-login) creates a session; without one there is nothing to update.
  const user = authConfigured() ? (await (await createClient()).auth.getUser()).data.user : null;
  return (
    <AuthShell locale={locale} d={d} variant="login">
      {user ? (
        <NewPasswordForm locale={locale} d={d} first={sp.first === "1"} />
      ) : (
        <p role="alert" className="rounded-2xl bg-goldsoft p-5 text-lg">{d.auth.reset.needLink}</p>
      )}
    </AuthShell>
  );
}
