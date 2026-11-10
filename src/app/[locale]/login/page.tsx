import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/forms/LoginForm";
import { getDict, isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { authConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type P = { params: Promise<{ locale: string }>; searchParams: Promise<{ error?: string; verified?: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "login", d.auth.login.title, d.auth.login.subtitle);
}

export default async function Login({ params, searchParams }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const d = await getDict(locale);

  // Already signed in → straight to the workspace.
  const hasSession = (await cookies()).getAll().some((c) => c.name.startsWith("sb-"));
  if (authConfigured() && hasSession) {
    const { data } = await (await createClient()).auth.getUser();
    if (data.user) redirect(href(locale, "app"));
  }

  return (
    <AuthShell locale={locale} d={d} variant="login">
      <LoginForm locale={locale} d={d} notice={sp.error === "link_expired" ? "link_expired" : sp.verified ? "verified" : undefined} />
    </AuthShell>
  );
}
