import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

const migrations = ["20261110000000_public_site_foundation.sql", "20261110000100_move_rls_helpers_to_private_schema.sql", "20261110000200_staff_clear_must_change_password.sql"];
const sql = migrations.map((f) => readFileSync(new URL(`../supabase/migrations/${f}`, import.meta.url), "utf8")).join("\n");
let db: PGlite;

async function signup(email: string, meta: Record<string, unknown>, confirmed = false) {
  const r = await db.query<{ id: string }>(
    "insert into auth.users (email, raw_user_meta_data, email_confirmed_at) values ($1, $2::jsonb, $3) returning id",
    [email, JSON.stringify(meta), confirmed ? new Date().toISOString() : null],
  );
  return r.rows[0].id;
}
async function asUser<T>(id: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${id}', false);`);
  try { return await fn(); } finally { await db.exec("reset role;"); }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create role anon nologin; create role authenticated nologin;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  await db.exec(sql);
  await db.exec("grant usage on schema public to anon, authenticated;");
});

describe("registration trigger – SRS §5.1, §5.3, §5.6", () => {
  it("creates a pending cargo-owner profile that is never verified", async () => {
    const id = await signup("owner@example.com", { full_name: "Asha Mushi", account_type: "cargo_owner", business_name: "Mushi Traders", country: "TZ", phone: "+255712345678", locale: "sw", marketing_consent: true, terms_version: "v1", terms_accepted_at: "2026-11-10T10:00:00Z" });
    const p = (await db.query<any>("select * from public.profiles where id=$1", [id])).rows[0];
    expect(p).toMatchObject({ role: "cargo_owner", status: "pending_contact_verification", locale: "sw", marketing_consent: true, phone: "+255712345678" });
    const c = (await db.query<any>("select * from public.cargo_owners where profile_id=$1", [id])).rows[0];
    expect(c).toMatchObject({ business_name: "Mushi Traders", verification_status: "unverified" });
  });

  it("creates a transporter company (unverified) with the registrant as owner", async () => {
    const id = await signup("fleet@example.com", { full_name: "John Banda", account_type: "transporter", business_name: "Banda Haulage Ltd", country: "ZM", phone: "+260971234567" });
    const co = (await db.query<any>("select * from public.transporter_companies where owner_profile_id=$1", [id])).rows[0];
    expect(co).toMatchObject({ registered_name: "Banda Haulage Ltd", verification_status: "unverified", country: "ZM" });
    const m = (await db.query<any>("select member_role from public.company_members where profile_id=$1", [id])).rows[0];
    expect(m.member_role).toBe("owner");
  });

  it("ignores any attempt to self-assign a privileged role (privilege-escalation guard)", async () => {
    for (const evil of ["super_admin", "ceo", "finance_officer", "driver", "affiliate", "broker"]) {
      const id = await signup(`${evil}@example.com`, { full_name: "Mallory Test", account_type: evil, role: evil });
      const p = (await db.query<any>("select role from public.profiles where id=$1", [id])).rows[0];
      expect(p.role).toBe("cargo_owner");
    }
  });

  it("moves to 'limited' after contact verification, never to verified; audit is written", async () => {
    const id = await signup("confirm@example.com", { full_name: "Chanda Mwila", account_type: "cargo_owner" });
    await db.query("update auth.users set email_confirmed_at = now() where id=$1", [id]);
    const p = (await db.query<any>("select status from public.profiles where id=$1", [id])).rows[0];
    expect(p.status).toBe("limited");
    const a = (await db.query<any>("select action from public.audit_logs where actor_id=$1 order by id", [id])).rows.map((r) => r.action);
    expect(a).toEqual(["account_created", "contact_verified"]);
  });

  it("records a referral with a 60-day window, but only for valid active codes", async () => {
    const partner = await signup("partner@example.com", { full_name: "Partner One", account_type: "cargo_owner" });
    await db.query("insert into public.referral_codes (code, partner_profile_id) values ('ENC-AB12', $1), ('ENC-OLD1', $1)", [partner]);
    await db.query("update public.referral_codes set active=false where code='ENC-OLD1'");
    const ok = await signup("ref1@example.com", { full_name: "Ref One", account_type: "cargo_owner", referral_code: "enc-ab12" });
    const bad = await signup("ref2@example.com", { full_name: "Ref Two", account_type: "cargo_owner", referral_code: "ENC-OLD1" });
    const none = await signup("ref3@example.com", { full_name: "Ref Three", account_type: "cargo_owner", referral_code: "NOPE-0000" });
    const rows = (await db.query<any>("select referred_profile_id, referral_code, round(extract(epoch from window_ends_at - introduced_at)/86400)::int as days from public.referral_attributions")).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].referred_profile_id).toBe(ok);
    expect(rows[0].referral_code).toBe("ENC-AB12");
    expect(rows[0].days).toBe(60);
    expect([bad, none]).not.toContain(rows[0].referred_profile_id);
  });

  it("enforces unique phone numbers", async () => {
    await signup("dupe1@example.com", { full_name: "Dupe One", account_type: "cargo_owner", phone: "+255700000001" });
    await expect(signup("dupe2@example.com", { full_name: "Dupe Two", account_type: "cargo_owner", phone: "+255700000001" })).rejects.toThrow();
  });
});

describe("row-level security – SRS §30.2", () => {
  it("lets users read only their own profile", async () => {
    const a = await signup("rls-a@example.com", { full_name: "User A", account_type: "cargo_owner" });
    await signup("rls-b@example.com", { full_name: "User B", account_type: "cargo_owner" });
    const rows = await asUser(a, async () => (await db.query<any>("select id from public.profiles")).rows);
    expect(rows).toEqual([{ id: a }]);
  });

  it("blocks users from changing role, status or verification", async () => {
    const t = await signup("rls-t@example.com", { full_name: "Trans Port", account_type: "transporter", business_name: "Trans Port Ltd" });
    await expect(asUser(t, () => db.query("update public.profiles set role='super_admin' where id=$1", [t]))).rejects.toThrow(/permission denied/);
    await expect(asUser(t, () => db.query("update public.profiles set status='active' where id=$1", [t]))).rejects.toThrow(/permission denied/);
    await expect(asUser(t, () => db.query("update public.transporter_companies set verification_status='verified' where owner_profile_id=$1", [t]))).rejects.toThrow(/permission denied/);
    // harmless edits still work
    await asUser(t, () => db.query("update public.profiles set full_name='Trans Port Jr' where id=$1", [t]));
    await asUser(t, () => db.query("update public.transporter_companies set trading_name='TP Haulage' where owner_profile_id=$1", [t]));
    const r = (await db.query<any>("select role,status,full_name from public.profiles where id=$1", [t])).rows[0];
    expect(r).toMatchObject({ role: "transporter", full_name: "Trans Port Jr" });
  });

  it("hides other customers' companies and cargo-owner records", async () => {
    const a = await signup("iso-a@example.com", { full_name: "Iso A", account_type: "transporter", business_name: "Iso A Ltd" });
    const b = await signup("iso-b@example.com", { full_name: "Iso B", account_type: "transporter", business_name: "Iso B Ltd" });
    const rows = await asUser(a, async () => (await db.query<any>("select owner_profile_id from public.transporter_companies")).rows);
    expect(rows.map((r: any) => r.owner_profile_id)).toEqual([a]);
    expect(rows.map((r: any) => r.owner_profile_id)).not.toContain(b);
  });

  it("keeps leads and audit logs private from customers; staff see leads, only admin/CEO see audit", async () => {
    await db.query("insert into public.marketing_leads (full_name, email, message) values ('Lead One','l@example.com','hello world')");
    const cust = await signup("cust@example.com", { full_name: "Cust Omer", account_type: "cargo_owner" });
    const mk = await signup("mk@example.com", { full_name: "Mark Eting", account_type: "cargo_owner" });
    await db.query("update public.profiles set role='marketing_officer', status='active' where id=$1", [mk]);
    expect(await asUser(cust, async () => (await db.query("select * from public.marketing_leads")).rows.length)).toBe(0);
    expect(await asUser(cust, async () => (await db.query("select * from public.audit_logs")).rows.length)).toBe(0);
    expect(await asUser(mk, async () => (await db.query("select * from public.marketing_leads")).rows.length)).toBe(1);
    expect(await asUser(mk, async () => (await db.query("select * from public.audit_logs")).rows.length)).toBe(0);
    await expect(asUser(cust, () => db.query("insert into public.marketing_leads (full_name,email) values ('x','x@x.com')"))).rejects.toThrow(/permission denied/);
    const sa = await signup("sa@example.com", { full_name: "Super Admin", account_type: "cargo_owner" });
    await db.query("update public.profiles set role='super_admin', status='active' where id=$1", [sa]);
    expect(await asUser(sa, async () => (await db.query("select * from public.audit_logs")).rows.length)).toBeGreaterThan(0);
  });

  it("generates lead references", async () => {
    const r = (await db.query<any>("select reference from public.marketing_leads limit 1")).rows[0];
    expect(r.reference).toMatch(/^ENC-L-\d{4}-\d{5}$/);
  });
});

describe("staff first-login password rule – SRS §5.2", () => {
  it("lets staff clear only their own must-change flag, nothing else", async () => {
    const s1 = await signup("staff1@example.com", { full_name: "Staff One", account_type: "cargo_owner" });
    const s2 = await signup("staff2@example.com", { full_name: "Staff Two", account_type: "cargo_owner" });
    for (const [id, u] of [[s1, "staff.one"], [s2, "staff.two"]] as const) {
      await db.query("update public.profiles set role='operations_manager', status='active' where id=$1", [id]);
      await db.query("insert into public.staff_accounts (profile_id, username) values ($1,$2)", [id, u]);
    }
    await expect(asUser(s1, () => db.query("update public.staff_accounts set active=false where profile_id=$1", [s1]))).rejects.toThrow(/permission denied/);
    await asUser(s1, () => db.query("update public.staff_accounts set must_change_password=false where profile_id=$1", [s1]));
    expect((await db.query<any>("select must_change_password m from public.staff_accounts where profile_id=$1", [s1])).rows[0].m).toBe(false);
    await asUser(s1, () => db.query("update public.staff_accounts set must_change_password=false where profile_id=$1", [s2]));
    expect((await db.query<any>("select must_change_password m from public.staff_accounts where profile_id=$1", [s2])).rows[0].m).toBe(true); // other staff untouched (RLS hides the row)
    await expect(asUser(s1, () => db.query("update public.staff_accounts set must_change_password=true where profile_id=$1", [s1]))).rejects.toThrow(/row-level security/);
  });
});

