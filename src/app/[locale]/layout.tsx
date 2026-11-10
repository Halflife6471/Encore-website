import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { CookieBanner } from "@/components/CookieBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getDict, isLocale, LOCALES } from "@/lib/i18n";
import { metadataBase } from "@/lib/seo";
import { CONTACT, SITE_URL } from "@/lib/site";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#1D1D1B" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

/** Runs before first paint so the saved (or system) theme never flashes the wrong colours. */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("enc_theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})()`;

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
    openGraph: { images: [{ url: "/og.png", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: ["/og.png"] },
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
    url: SITE_URL,
    email: CONTACT.email,
    telephone: CONTACT.phone,
    address: { "@type": "PostalAddress", postOfficeBoxNumber: "72757", addressLocality: CONTACT.address.city, addressCountry: "TZ" },
    sameAs: [CONTACT.instagram, CONTACT.facebook],
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
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
