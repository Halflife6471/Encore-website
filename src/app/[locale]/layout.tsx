import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { CookieBanner } from "@/components/CookieBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getDict, isLocale, LOCALES } from "@/lib/i18n";
import { metadataBase } from "@/lib/seo";

export const viewport: Viewport = { themeColor: "#1D1D1B", width: "device-width", initialScale: 1 };

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return {
    metadataBase,
    title: { default: `${d.meta.siteName} — ${d.meta.tagline}`, template: `%s | ${d.meta.siteName}` },
    description: d.meta.description,
    icons: { icon: "/brand/encore-mark.png", apple: "/apple-touch-icon.png" },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);

  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: d.meta.siteName,
    slogan: d.meta.tagline,
    description: d.meta.description,
  };

  return (
    <html lang={locale}>
      <body className="min-h-screen font-sans antialiased">
        <Header locale={locale} nav={d.nav} />
        <main id="main">{children}</main>
        <Footer locale={locale} d={d} />
        <WhatsAppButton locale={locale} label={d.common.talkWhatsApp} />
        <CookieBanner locale={locale} d={d.cookie} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
      </body>
    </html>
  );
}
