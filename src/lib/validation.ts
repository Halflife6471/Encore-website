import { z } from "zod";
import { SELF_REGISTER_ROLES } from "./site";
import { COUNTRIES, countryByCode, toE164 } from "./countries";

/** Error codes are translated client-side; the server never sends free text. */
export type FieldErrors = Record<string, string>;

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890", "qwerty123", "qwertyuiop",
  "iloveyou", "admin123", "welcome1", "letmein123", "abc12345", "11111111", "00000000", "encore123", "encore2026",
]);

export const passwordSchema = z
  .string()
  .min(8, "password_short")
  .max(72, "password_long")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "password_weak")
  .refine((v) => !COMMON_PASSWORDS.has(v.toLowerCase()), "password_common");

const nameSchema = z
  .string()
  .trim()
  .min(2, "name_short")
  .max(80, "name_long")
  .regex(/^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u, "name_invalid");

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email("email_invalid"));

const countryCodeSchema = z.string().refine((c) => !!countryByCode(c), "country_invalid");

const phoneFields = z.object({ dial: countryCodeSchema, phone: z.string().trim().min(1, "phone_required") });

function withPhone<T extends { dial: string; phone: string }>(v: T, ctx: z.RefinementCtx) {
  const c = countryByCode(v.dial);
  if (!c || !toE164(c.dial, v.phone)) ctx.addIssue({ code: "custom", path: ["phone"], message: "phone_invalid" });
}

export const referralSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{4,24}$/, "referral_invalid")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const registerSchema = z
  .object({
    accountType: z.enum(SELF_REGISTER_ROLES, { error: "account_type_invalid" }),
    fullName: nameSchema,
    businessName: z.string().trim().max(120, "business_long").optional().default(""),
    email: emailSchema,
    password: passwordSchema,
    terms: z.literal("on", { error: "terms_required" }),
    marketing: z.string().optional(),
    referral: referralSchema,
    locale: z.enum(["en", "sw"]).default("en"),
  })
  .and(phoneFields)
  .superRefine((v, ctx) => {
    // SRS §8.2: a transporter registers a company; a cargo owner may be an individual (SRS §12.2).
    if (v.accountType === "transporter" && v.businessName.length < 2)
      ctx.addIssue({ code: "custom", path: ["businessName"], message: "business_required" });
    withPhone(v, ctx);
  });

export const loginSchema = z.object({
  mode: z.enum(["email", "phone"]).default("email"),
  email: z.string().trim().toLowerCase().optional().default(""),
  dial: z.string().optional().default("TZ"),
  phone: z.string().trim().optional().default(""),
  password: z.string().min(1, "password_required").max(128),
  remember: z.string().optional(),
  locale: z.enum(["en", "sw"]).default("en"),
});

export const staffLoginSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,40}$/, "username_invalid"),
  password: z.string().min(1, "password_required").max(128),
  locale: z.enum(["en", "sw"]).default("en"),
});

export const LEAD_TYPES = ["general", "cargo_owner", "transporter", "driver_help", "partner", "newsletter"] as const;
export const CORRIDORS = ["tz-zm", "tz-cd", "other"] as const;
export const CATEGORIES = ["cargo_owner", "transporter", "driver", "partner", "other"] as const;

export const leadSchema = z
  .object({
    leadType: z.enum(LEAD_TYPES).default("general"),
    fullName: nameSchema,
    company: z.string().trim().max(120).optional().default(""),
    email: emailSchema,
    country: countryCodeSchema.default("TZ"),
    dial: countryCodeSchema.default("TZ"),
    phone: z.string().trim().optional().default(""),
    category: z.enum(CATEGORIES).default("other"),
    corridor: z.enum(CORRIDORS).optional(),
    message: z.string().trim().min(10, "message_short").max(2000, "message_long"),
    consent: z.literal("on", { error: "consent_required" }),
    updates: z.string().optional(),
    locale: z.enum(["en", "sw"]).default("en"),
  })
  .superRefine((v, ctx) => {
    if (v.phone) withPhone({ dial: v.dial, phone: v.phone }, ctx);
  });

export const emailOnlySchema = z.object({ email: emailSchema, locale: z.enum(["en", "sw"]).default("en") });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string(), locale: z.enum(["en", "sw"]).default("en") })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "password_mismatch" });

export function flattenErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function formToObject(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}

export { COUNTRIES };
