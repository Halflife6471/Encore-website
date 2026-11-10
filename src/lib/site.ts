/** Site-wide constants and environment-driven contact details (never invented). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Official Encore contact details (supplied by the client). Environment variables can override them per deployment. */
const phoneRaw = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+255 744 889 900";
export const CONTACT = {
  phone: phoneRaw,
  /** Calls and WhatsApp share the same number. Digits only, with country code, for wa.me links. */
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "255744889900").replace(/[^\d]/g, ""),
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "info@encoreholdings.africa",
  instagram: "https://www.instagram.com/encoreholdings_group/",
  facebook: "https://www.facebook.com/encoreholdingsgroup",
  handle: "@encoreholdings_group",
  address: { box: "P.O. Box 72757", city: "Dar es Salaam", country: "Tanzania" },
};

/** Shown only in non-production so layouts can be reviewed; production shows nothing until Encore supplies real values. */
export const SHOW_PLACEHOLDERS = process.env.NODE_ENV !== "production";

/** Version recorded with every registration (SRS §5.3 step 6, SRD WEB-029). */
export const TERMS_VERSION = "2026-11-draft-1";
export const PRIVACY_VERSION = "2026-11-draft-1";

/** Referral attribution window (SRS §21.6: 60-day first qualifying booking window). */
export const REFERRAL_COOKIE = "enc_ref";
export const REFERRAL_WINDOW_DAYS = 60;

/** Account types that may self-register publicly (SRS §5.1 / §38 #2 #4 #6 #7). */
export const SELF_REGISTER_ROLES = ["cargo_owner", "transporter"] as const;
export type SelfRegisterRole = (typeof SELF_REGISTER_ROLES)[number];
