"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, SESSION_ONLY_COOKIE } from "@/lib/supabase/server";
import { createAdminClient, audit } from "@/lib/supabase/admin";
import { adminConfigured, authConfigured } from "@/lib/supabase/env";
import { SITE_URL, TERMS_VERSION } from "@/lib/site";
import { countryByCode, toE164 } from "@/lib/countries";
import { clientIp, hit, peek, reset } from "@/lib/rate-limit";
import { href } from "@/lib/routes";
import type { Locale } from "@/lib/i18n-config";
import {
  emailOnlySchema,
  flattenErrors,
  formToObject,
  loginSchema,
  newPasswordSchema,
  registerSchema,
  staffLoginSchema,
} from "@/lib/validation";
import type { ActionState } from "./types";

const MIN = 60_000;
const loc = (v: unknown): Locale => (v === "sw" ? "sw" : "en");

/** Never echo secrets back to the browser. */
function safeValues(raw: Record<string, string>): Record<string, string> {
  const { password, confirm, ...rest } = raw;
  void password; void confirm;
  return rest;
}

/** Slow, uniform failure so wrong-user and wrong-password look identical. */
const stall = () => new Promise((r) => setTimeout(r, 350));

/* ------------------------------------------------------------------ register */
export async function registerAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const raw = formToObject(fd);
  const values = safeValues(raw);
  if (raw.company_website) return { error: "bot", values }; // honeypot (field hidden from humans)

  const ip = await clientIp();
  if (!hit(`register:${ip}`, 5, 15 * MIN).ok) return { error: "locked", values };

  // Only the two publicly self-registrable roles pass validation (SRS §5.1).
  const parsed = registerSchema.safeParse({ ...raw, locale: loc(raw.locale) });
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error), values };
  const v = parsed.data;

  if (!authConfigured()) return { error: "unavailable", values };

  const country = countryByCode(v.dial)!;
  const phone = toE164(country.dial, v.phone)!;

  // Phones are unique. Respond with the same generic prompt as for an existing email (SRD RG-11).
  if (adminConfigured()) {
    const { data } = await createAdminClient().from("profiles").select("id").eq("phone", phone).maybeSingle();
    if (data) return { error: "exists", values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(href(v.locale, "app"))}`,
      data: {
        full_name: v.fullName,
        account_type: v.accountType,
        business_name: v.businessName,
        phone,
        country: country.code,
        locale: v.locale,
        marketing_consent: v.marketing === "on",
        terms_version: TERMS_VERSION,
        terms_accepted_at: new Date().toISOString(),
        referral_code: v.referral ?? "",
      },
    },
  });

  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "weak_password") return { fieldErrors: { password: "password_weak" }, values };
    if (code === "user_already_exists" || code === "email_exists" || code === "phone_exists") return { error: "exists", values };
    if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit") return { error: "locked", values };
    return { error: "generic", values };
  }
  // Supabase returns success for already-registered emails (no enumeration): we do the same.
  return { ok: true, email: v.email, values };
}

/* --------------------------------------------------------------------- login */
export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const raw = formToObject(fd);
  const values = safeValues(raw);
  const parsed = loginSchema.safeParse({ ...raw, locale: loc(raw.locale) });
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error), values };
  const v = parsed.data;

  // Resolve identifier (email or phone → email). Validate before anything else so users get field feedback.
  let email = v.email;
  let ident = v.email;
  if (v.mode === "phone") {
    const c = countryByCode(v.dial);
    const e164 = c ? toE164(c.dial, v.phone) : null;
    if (!e164) return { fieldErrors: { phone: "phone_invalid" }, values };
    ident = e164;
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { fieldErrors: { email: "email_invalid" }, values };
  }

  if (!authConfigured()) return { error: "unavailable", values };

  const ip = await clientIp();
  const key = `login:${ip}:${ident}`;
  if (!peek(key, 5, 15 * MIN)) return { error: "locked", values };

  if (v.mode === "phone") {
    if (!adminConfigured()) return { error: "unavailable", values };
    const { data } = await createAdminClient().from("profiles").select("email").eq("phone", ident).maybeSingle();
    if (!data?.email) {
      hit(key, 5, 15 * MIN);
      await stall();
      return { error: "invalid_credentials", values };
    }
    email = data.email;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: v.password });
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") return { error: "not_confirmed", email, values };
    hit(key, 5, 15 * MIN);
    if (adminConfigured()) await audit("login_failed", { metadata: { mode: v.mode, ip } });
    await stall();
    return { error: "invalid_credentials", values };
  }

  // Suspended accounts never get a session (SRS §5.6).
  const { data: profile } = await supabase.from("profiles").select("status").eq("id", data.user.id).maybeSingle();
  if (profile?.status === "suspended") {
    await supabase.auth.signOut();
    return { error: "suspended", values };
  }

  reset(key);
  const jar = await cookies();
  if (v.remember === "on") jar.delete(SESSION_ONLY_COOKIE);
  else jar.set(SESSION_ONLY_COOKIE, "1", { path: "/", sameSite: "lax", httpOnly: true });
  if (adminConfigured()) await audit("login", { actorId: data.user.id });

  redirect(href(v.locale, "app"));
}

/* ---------------------------------------------------------------- staff login */
export async function staffLoginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const raw = formToObject(fd);
  const values = safeValues(raw);
  const parsed = staffLoginSchema.safeParse({ ...raw, locale: loc(raw.locale) });
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error), values };
  const v = parsed.data;
  if (!adminConfigured()) return { error: "unavailable", values };

  const ip = await clientIp();
  const key = `staff:${ip}:${v.username}`;
  if (!peek(key, 5, 15 * MIN)) return { error: "locked", values };

  const admin = createAdminClient();
  const { data: staff } = await admin
    .from("staff_accounts")
    .select("profile_id, active, must_change_password, profiles(email, status)")
    .eq("username", v.username)
    .maybeSingle();
  const prof = Array.isArray(staff?.profiles) ? staff?.profiles[0] : staff?.profiles;

  if (!staff || !staff.active || !prof?.email || prof.status === "suspended") {
    hit(key, 5, 15 * MIN);
    await audit("staff_login_failed", { metadata: { username: v.username, ip } });
    await stall();
    return { error: "invalid_credentials", values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: prof.email, password: v.password });
  if (error) {
    hit(key, 5, 15 * MIN);
    await audit("staff_login_failed", { actorId: staff.profile_id, metadata: { ip } });
    await stall();
    return { error: "invalid_credentials", values };
  }
  reset(key);
  await audit("staff_login", { actorId: staff.profile_id });
  // First login must change the initial password (SRS §5.2).
  if (staff.must_change_password) redirect(`${href(v.locale, "reset")}/update?first=1`);
  redirect(href(v.locale, "app"));
}

/* -------------------------------------------------------------------- logout */
export async function logoutAction(fd: FormData) {
  const locale = loc(fd.get("locale"));
  if (authConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    await supabase.auth.signOut();
    if (data.user && adminConfigured()) await audit("logout", { actorId: data.user.id });
  }
  (await cookies()).delete(SESSION_ONLY_COOKIE);
  redirect(href(locale, "login"));
}

/* ----------------------------------------------------------- password recovery */
export async function forgotPasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const raw = formToObject(fd);
  const parsed = emailOnlySchema.safeParse({ ...raw, locale: loc(raw.locale) });
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error), values: raw };
  if (!authConfigured()) return { error: "unavailable", values: raw };
  const ip = await clientIp();
  if (!hit(`forgot:${ip}`, 5, 15 * MIN).ok) return { error: "locked", values: raw };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(`${href(parsed.data.locale, "reset")}/update`)}`,
  });
  // Always the same answer – never reveal whether the account exists.
  return { ok: true, email: parsed.data.email };
}

export async function newPasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const raw = formToObject(fd);
  const parsed = newPasswordSchema.safeParse({ ...raw, locale: loc(raw.locale) });
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error) };
  if (!authConfigured()) return { error: "unavailable" };

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { error: "generic" };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: (error as { code?: string }).code === "weak_password" ? "password_weak" : "generic" };
  }
  if (adminConfigured()) {
    const admin = createAdminClient();
    await admin.from("staff_accounts").update({ must_change_password: false }).eq("profile_id", u.user.id);
    await audit("password_changed", { actorId: u.user.id });
  }
  redirect(href(parsed.data.locale, "app"));
}

/* ------------------------------------------------------ resend verification */
export async function resendVerificationAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const raw = formToObject(fd);
  const parsed = emailOnlySchema.safeParse({ ...raw, locale: loc(raw.locale) });
  if (!parsed.success) return { fieldErrors: flattenErrors(parsed.error), values: raw };
  if (!authConfigured()) return { error: "unavailable", values: raw };
  const ip = await clientIp();
  if (!hit(`resend:${ip}:${parsed.data.email}`, 1, MIN).ok) return { error: "locked", email: parsed.data.email };

  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(href(parsed.data.locale, "app"))}` },
  });
  return { ok: true, email: parsed.data.email };
}
