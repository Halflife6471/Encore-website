import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { LinkButton, PageHero, Section } from "@/components/ui";
import { getDict, isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { authConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type P = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMeta(locale, "track", d.auth.track.title, d.auth.track.lead);
}

/** Location data is restricted to authorised users on active shipments (SRS §18.4), so tracking is sign-in gated. */
export default async function Track({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const t = d.auth.track;
  const hasSession = (await cookies()).getAll().some((c) => c.name.startsWith("sb-"));
  const signedIn = authConfigured() && hasSession ? !!(await (await createClient()).auth.getUser()).data.user : false;
  return (
    <>
      <PageHero title={t.title} lead={t.lead} />
      <Section>
        <div className="card max-w-2xl">
          <p className="text-lg text-g3">{signedIn ? t.signedIn : t.signedOut}</p>
          {!signedIn && <div className="mt-6"><LinkButton href={href(locale, "login")} arrow>{d.nav.login}</LinkButton></div>}
        </div>
      </Section>
    </>
  );
}
