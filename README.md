# Encore Holdings Group — Digital Logistics Marketplace (public website)

Implements **ENCORE-SRD-WEB-001** (`docs/Encore-Public-Website-SRD.pdf`), derived from ENCORE-SRS-001 v2.1.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Outfit typeface · Supabase Auth + PostgreSQL (RLS) · Vercel.

## Build status

### Step 1 — foundation (done)
- Brand design system: Gold `#FFBC0D`, Charcoal `#1D1D1B`, `#D1D3D4`, `#A7A9AC`, `#3D4348`, black; Outfit; horizontal logo (`public/brand`).
- English + Swahili with localised URLs (`/sw/kuhusu`, `/sw/ingia`, …), hreflang, sitemap, robots, JSON-LD.
- All 14 SRS §7.1 pages + staff sign-in, track (sign-in gated), verify, password reset, limited workspace.
- Sign-in / sign-up screens (split layout). Only **Cargo Owner** and **Transporter** can self-register; Driver / Affiliate are invitation-only; staff have a separate username sign-in.
- Server actions: register, login (email or phone), staff login, logout, password recovery, resend verification, lead capture — with validation, honeypot, rate limiting, non-enumerating errors, audit log.
- Database migration with RLS and a privilege-escalation guard (`supabase/migrations`).
- Commercial rules engine (`src/lib/commercial.ts`): 5% / USD 300 minimum, managed margin, partner tiers, minimum-retention protection, attribution window, reward eligibility. **Not shown publicly** (SRD WEB-013).

### Next steps
- Step 2: company profile + truck registration + private document upload (transporter), cargo-owner profile and cargo requests.
- Step 3: staff verification queue, quotations, bookings, central invoicing and settlement.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in Supabase values (see below)
npm run dev                  # http://localhost:3000
npm test                     # rules engine + database/RLS tests (embedded Postgres)
npm run build
```

Without Supabase variables the public pages work; sign-in, sign-up and forms show a clear "being set up" message instead of failing silently.

## Supabase setup (Encore-owned project)

Project **Encore-website** (organization *Encore Holdings*, region eu-central-1) is already created and both migrations are applied.
For a new environment:

1. Create a project under Encore's own Supabase account (SRS §39.3).
2. Apply the files in `supabase/migrations/` in order (SQL editor or `supabase db push`).
3. Auth → URL configuration: Site URL = `NEXT_PUBLIC_SITE_URL`; add `…/auth/callback` to redirect URLs. Keep **Confirm email** enabled.
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the server-only `SUPABASE_SERVICE_ROLE_KEY` (never expose it to the browser).
5. Create the first Super Admin manually (Auth user + `profiles.role = 'super_admin'` + `staff_accounts` row); staff accounts are never self-registered (SRS §5.2).

## Business rules enforced in code

| Rule (SRS) | Where |
|---|---|
| Only cargo owners and transporters self-register (§5.1) | `validation.ts` + DB trigger ignores any other role |
| Registration ≠ verification; status starts *pending*, company *unverified* (§5.3, §5.6) | DB trigger, workspace page |
| Users cannot edit role / status / verification (§30.2) | column-level grants + RLS |
| Referral `?ref=` kept 60 days, no self-referral, valid active codes only (§21.6, §21.12) | `proxy.ts`, DB trigger |
| Leads from website forms with UTM (§25) | `actions/leads.ts` |
| Service-role key server-only (§30.3) | `supabase/admin.ts` (`server-only`) |
| Commission = MAX(5% × freight, USD 300); partner reward capped so Encore keeps ≥ USD 300 (§19, §21.8) | `commercial.ts` + tests |
