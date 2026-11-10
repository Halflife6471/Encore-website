import type { Locale } from "@/lib/i18n-config";
import { CONTACT } from "@/lib/site";
import { IconChat } from "./ui";

const MESSAGE: Record<Locale, string> = {
  en: "Hello Encore, I would like to know more about your logistics marketplace.",
  sw: "Habari Encore, ningependa kujua zaidi kuhusu soko lenu la usafirishaji.",
};

/** Click-to-chat only. Hidden until Encore supplies its approved WhatsApp Business number (SRD WEB-034). */
export function WhatsAppButton({ locale, label }: { locale: Locale; label: string }) {
  if (!CONTACT.whatsapp) return null;
  return (
    <a
      href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(MESSAGE[locale])}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gold text-char shadow-lift transition hover:scale-105"
    >
      <IconChat className="h-7 w-7" />
    </a>
  );
}
