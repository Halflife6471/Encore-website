import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

const migrations = ["20261110000000_public_site_foundation.sql", "20261110000100_move_rls_helpers_to_private_schema.sql", "20261110000200_staff_clear_must_change_password.sql", "20261112000000_marketplace_listings.sql", "20261112000100_seed_sample_marketplace.sql", "20261113000000_listing_forms.sql"];
const sql = migrations.map((f) => readFileSync(new URL(`../supabase/migrations/${f}`, import.meta.url), "utf8")).join("\n");
let db: PGlite;

async function signup(email: string, meta: Record<string, unknown>, confirmed = false) {
  const r = await db.query<{ id: string }>(
    "insert into auth.users (email, raw_user_meta_data, email_confirmed_at) values ($1, $2::jsonb, $3) returning id",
    [email, JSON.stringify(meta), confirmed ? new Date().toISOString() : null],
  );
  return r.rows[0].id;
}
async function asAnon<T>(fn: () => Promise<T>): Promise<T> {
  await db.exec("set role anon;");
  try { return await fn(); } finally { await db.exec("reset role;"); }
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

  it("instant sign-up (email confirmation off): signs in as 'limited' immediately, still never verified, and sees no private marketplace data", async () => {
    const id = await signup("instant@example.com", { full_name: "Instant User", account_type: "transporter", business_name: "Instant Haulage Ltd", phone: "+255700000555" }, true);
    const p = (await db.query<any>("select role,status from public.profiles where id=$1", [id])).rows[0];
    expect(p).toEqual({ role: "transporter", status: "limited" });
    const co = (await db.query<any>("select verification_status from public.transporter_companies where owner_profile_id=$1", [id])).rows[0];
    expect(co.verification_status).toBe("unverified");
    expect(await asUser(id, async () => (await db.query("select * from public.cargo_request_private")).rows.length)).toBe(0);
    expect(await asUser(id, async () => (await db.query("select 1 from public.cargo_requests")).rows.length)).toBe(20); // public listings still visible
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


describe("marketplace visibility – public data open, sensitive data verified-only", () => {
  it("seeds 20 sample loads and 25 sample trucks, all marked as samples", async () => {
    const l = (await db.query<any>("select count(*)::int n, bool_and(is_sample) s from public.cargo_requests where status='published'")).rows[0];
    const t = (await db.query<any>("select count(*)::int n, bool_and(is_sample) s from public.trucks where status='published'")).rows[0];
    expect(l).toEqual({ n: 20, s: true });
    expect(t).toEqual({ n: 25, s: true });
  });

  it("lets signed-out visitors read published listings, prices included", async () => {
    const rows = await asAnon(async () => (await db.query<any>("select reference, budget_min_usd, budget_max_usd from public.cargo_requests")).rows);
    expect(rows).toHaveLength(20);
    expect(rows[0].budget_min_usd).toBeGreaterThan(0);
    expect(await asAnon(async () => (await db.query<any>("select rate_min_usd_per_km from public.trucks")).rows.length)).toBe(25);
  });

  it("never exposes company or contact details to signed-out visitors", async () => {
    await expect(asAnon(() => db.query("select * from public.cargo_request_private"))).rejects.toThrow(/permission denied/);
    await expect(asAnon(() => db.query("select * from public.truck_private"))).rejects.toThrow(/permission denied/);
  });

  it("hides unpublished listings from visitors", async () => {
    await db.query("update public.cargo_requests set status='pending_review' where reference='EN-L-2041'");
    expect(await asAnon(async () => (await db.query("select 1 from public.cargo_requests where reference='EN-L-2041'")).rows.length)).toBe(0);
    await db.query("update public.cargo_requests set status='published' where reference='EN-L-2041'");
  });

  it("keeps private details hidden from registered-but-unverified accounts, and shows them once verified", async () => {
    const owner = await signup("mk-owner@example.com", { full_name: "Mk Owner", account_type: "cargo_owner" }, true);
    expect(await asUser(owner, async () => (await db.query("select * from public.cargo_request_private")).rows.length)).toBe(0);
    expect(await asUser(owner, async () => (await db.query("select * from public.truck_private")).rows.length)).toBe(0);
    // public data is still visible to them
    expect(await asUser(owner, async () => (await db.query("select 1 from public.cargo_requests")).rows.length)).toBe(20);

    await db.query("update public.cargo_owners set verification_status='under_review' where profile_id=$1", [owner]);
    expect(await asUser(owner, async () => (await db.query("select * from public.cargo_request_private")).rows.length)).toBe(0);

    await db.query("update public.cargo_owners set verification_status='verified' where profile_id=$1", [owner]);
    const priv = await asUser(owner, async () => (await db.query<any>("select company_name, contact_email from public.cargo_request_private")).rows);
    expect(priv).toHaveLength(20);
    expect(await asUser(owner, async () => (await db.query("select * from public.truck_private")).rows.length)).toBe(25);
  });

  it("treats a verified transporter company the same way", async () => {
    const tr = await signup("mk-trans@example.com", { full_name: "Mk Trans", account_type: "transporter", business_name: "Mk Trans Ltd" }, true);
    expect(await asUser(tr, async () => (await db.query("select * from public.cargo_request_private")).rows.length)).toBe(0);
    await db.query("update public.transporter_companies set verification_status='verified' where owner_profile_id=$1", [tr]);
    expect(await asUser(tr, async () => (await db.query("select * from public.cargo_request_private")).rows.length)).toBe(20);
  });

  it("does not let customers create, edit or delete listings", async () => {
    const u = await signup("mk-evil@example.com", { full_name: "Mk Evil", account_type: "cargo_owner" }, true);
    await expect(asUser(u, () => db.query("update public.cargo_requests set budget_min_usd=1 where reference='EN-L-2041'"))).resolves.toBeDefined();
    expect((await db.query<any>("select budget_min_usd from public.cargo_requests where reference='EN-L-2041'")).rows[0].budget_min_usd).toBe(3800); // RLS hid the row: nothing changed
    await expect(asUser(u, () => db.query("delete from public.trucks"))).resolves.toBeDefined();
    expect((await db.query<any>("select count(*)::int n from public.trucks")).rows[0].n).toBe(25);
    await expect(asUser(u, () => db.query(`insert into public.cargo_requests (reference,status,corridor,origin_city,origin_country,destination_city,destination_country,distance_km,transit_days_min,transit_days_max,commodity_en,cargo_type,packaging,weight_t,vehicle_type,pickup_from,pickup_to,deliver_by) values ('X-1','published','domestic','A','TZ','B','TZ',10,1,1,'x','general','loose',1,'box',now(),now(),now())`))).rejects.toThrow(/row-level security/);
  });

  it("lets staff manage listings", async () => {
    const s = await signup("mk-staff@example.com", { full_name: "Mk Staff", account_type: "cargo_owner" });
    await db.query("update public.profiles set role='operations_manager', status='active' where id=$1", [s]);
    await asUser(s, () => db.query("update public.cargo_requests set urgent=true where reference='EN-L-2041'"));
    expect((await db.query<any>("select urgent from public.cargo_requests where reference='EN-L-2041'")).rows[0].urgent).toBe(true);
    expect(await asUser(s, async () => (await db.query("select * from public.truck_private")).rows.length)).toBe(25);
  });
});

describe("listing forms – customers post loads and register trucks, only staff publish", () => {
  const loadSql = (owner: string, status = "pending_review", extra = "") =>
    `insert into public.cargo_requests (owner_profile_id,status,corridor,origin_city,origin_country,destination_city,destination_country,distance_km,transit_days_min,transit_days_max,commodity_en,cargo_type,packaging,weight_t,vehicle_type,pickup_from,pickup_to,deliver_by ${extra.split("|")[0] ?? ""})
     values ('${owner}','${status}','tz-zm','Dar es Salaam','TZ','Lusaka','ZM',1980,5,8,'Cement','construction','bagged',30,'curtainside',current_date+2,current_date+4,current_date+10 ${extra.split("|")[1] ?? ""}) returning id, reference, status`;
  const truckSql = (company: string, status = "pending_review") =>
    `insert into public.trucks (company_id,status,vehicle_type,make_model,year,axle_configuration,payload_t,body_spec,location_city,location_country,available_from,corridors,features)
     values ('${company}','${status}','flatbed','Scania R450',2022,'6x4',34,'13.6 x 2.5 m','Dar es Salaam','TZ',current_date,array['tz-zm'],array['gps']) returning id, reference, status`;

  it("lets a cargo owner post a load for review and generates a reference", async () => {
    const o = await signup("form-owner@example.com", { full_name: "Form Owner", account_type: "cargo_owner", business_name: "Owner Ltd" }, true);
    const r = await asUser(o, async () => (await db.query<any>(loadSql(o))).rows[0]);
    expect(r.status).toBe("pending_review");
    expect(r.reference).toMatch(/^EN-L-3\d{3}$/);
    // the owner sees it; signed-out visitors do not (it is not published)
    expect(await asUser(o, async () => (await db.query("select 1 from public.cargo_requests where reference=$1", [r.reference])).rows.length)).toBe(1);
    expect(await asAnon(async () => (await db.query("select 1 from public.cargo_requests where reference=$1", [r.reference])).rows.length)).toBe(0);
  });

  it("does not let customers publish, impersonate, or create samples", async () => {
    const o = await signup("form-evil@example.com", { full_name: "Form Evil", account_type: "cargo_owner" }, true);
    const other = await signup("form-victim@example.com", { full_name: "Form Victim", account_type: "cargo_owner" }, true);
    await expect(asUser(o, () => db.query(loadSql(o, "published")))).rejects.toThrow(/row-level security/);
    await expect(asUser(o, () => db.query(loadSql(other)))).rejects.toThrow(/row-level security/);
    await expect(asUser(o, () => db.query(loadSql(o, "pending_review", ",is_sample|,true")))).rejects.toThrow(/row-level security/);
  });

  it("blocks transporters and suspended accounts from posting loads", async () => {
    const t = await signup("form-trans@example.com", { full_name: "Form Trans", account_type: "transporter", business_name: "Form Trans Ltd" }, true);
    await expect(asUser(t, () => db.query(loadSql(t)))).rejects.toThrow(/row-level security/);
    const s = await signup("form-susp@example.com", { full_name: "Form Susp", account_type: "cargo_owner" }, true);
    await db.query("update public.profiles set status='suspended' where id=$1", [s]);
    await expect(asUser(s, () => db.query(loadSql(s)))).rejects.toThrow(/row-level security/);
  });

  it("lets the owner close a listing but never set it to published, and resets review fields", async () => {
    const o = await signup("form-close@example.com", { full_name: "Form Close", account_type: "cargo_owner" }, true);
    const r = await asUser(o, async () => (await db.query<any>(loadSql(o))).rows[0]);
    await asUser(o, () => db.query("update public.cargo_requests set status='closed' where id=$1", [r.id]));
    await db.query("update public.cargo_requests set status='pending_review' where id=$1", [r.id]);
    await expect(asUser(o, () => db.query("update public.cargo_requests set status='published' where id=$1", [r.id]))).rejects.toThrow(/row-level security/);
    await asUser(o, () => db.query("update public.cargo_requests set rejected_reason='hack', reviewed_at=now(), reference='EN-L-1' where id=$1", [r.id]));
    const row = (await db.query<any>("select reference, rejected_reason, reviewed_at from public.cargo_requests where id=$1", [r.id])).rows[0];
    expect(row).toEqual({ reference: r.reference, rejected_reason: null, reviewed_at: null });
  });

  it("stores private contact details for the owner's own load only", async () => {
    const o = await signup("form-priv@example.com", { full_name: "Form Priv", account_type: "cargo_owner" }, true);
    const x = await signup("form-priv2@example.com", { full_name: "Form Priv2", account_type: "cargo_owner" }, true);
    const mine = await asUser(o, async () => (await db.query<any>(loadSql(o))).rows[0]);
    const ins = (id: string) => `insert into public.cargo_request_private (cargo_request_id,company_name,contact_name,contact_phone,contact_email) values ('${id}','Owner Ltd','Form Priv','+255700000001','a@b.co')`;
    await asUser(o, () => db.query(ins(mine.id)));
    await expect(asUser(x, () => db.query(ins(mine.id)))).rejects.toThrow(/row-level security/);
    // other customers (even verified) cannot read it while the load is unpublished
    await db.query("update public.cargo_owners set verification_status='verified' where profile_id=$1", [x]);
    expect(await asUser(x, async () => (await db.query("select 1 from public.cargo_request_private where cargo_request_id=$1", [mine.id])).rows.length)).toBe(0);
    expect(await asUser(o, async () => (await db.query("select 1 from public.cargo_request_private where cargo_request_id=$1", [mine.id])).rows.length)).toBe(1);
  });

  it("lets a transporter company administrator register trucks for their own company only", async () => {
    const t = await signup("form-fleet@example.com", { full_name: "Form Fleet", account_type: "transporter", business_name: "Fleet Ltd" }, true);
    const u = await signup("form-fleet2@example.com", { full_name: "Form Fleet2", account_type: "transporter", business_name: "Fleet Two Ltd" }, true);
    const myCo = (await db.query<any>("select id from public.transporter_companies where owner_profile_id=$1", [t])).rows[0].id;
    const otherCo = (await db.query<any>("select id from public.transporter_companies where owner_profile_id=$1", [u])).rows[0].id;
    const r = await asUser(t, async () => (await db.query<any>(truckSql(myCo))).rows[0]);
    expect(r.reference).toMatch(/^EN-T-3\d{3}$/);
    await expect(asUser(t, () => db.query(truckSql(otherCo)))).rejects.toThrow(/row-level security/);
    await expect(asUser(t, () => db.query(truckSql(myCo, "published")))).rejects.toThrow(/row-level security/);
    // a cargo owner cannot register trucks
    const o = await signup("form-notfleet@example.com", { full_name: "Not Fleet", account_type: "cargo_owner" }, true);
    await expect(asUser(o, () => db.query(truckSql(myCo)))).rejects.toThrow(/row-level security/);
    // the company can record documents for its truck; nobody else can
    const doc = (id: string) => `insert into public.truck_documents (truck_id,doc_type,storage_path,file_name,mime_type,size_bytes) values ('${id}','insurance','${myCo}/${id}/insurance-1.pdf','policy.pdf','application/pdf',1234)`;
    await asUser(t, () => db.query(doc(r.id)));
    await expect(asUser(u, () => db.query(doc(r.id)))).rejects.toThrow(/row-level security/);
    expect(await asUser(t, async () => (await db.query("select 1 from public.truck_documents where truck_id=$1", [r.id])).rows.length)).toBe(1);
    expect(await asUser(u, async () => (await db.query("select 1 from public.truck_documents where truck_id=$1", [r.id])).rows.length)).toBe(0);
  });
});
