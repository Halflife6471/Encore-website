-- ============================================================================
-- Encore Digital Logistics Marketplace – public website foundation
-- Source: ENCORE-SRS-001 v2.1 (§5 roles, §8/§12 onboarding, §21 referrals,
-- §25 leads, §29 entities, §30 security) and ENCORE-SRD-WEB-001.
--
-- Principles enforced in the database (not only in the UI):
--   * Only 'cargo_owner' and 'transporter' can be requested at self-registration;
--     any other value is ignored (least privilege)            – SRS §5.1, §38 #2
--   * A new account is NEVER verified: status starts at
--     'pending_contact_verification', company/owner at 'unverified' – SRS §5.3, §5.6
--   * Users cannot change role/status/verification (column-level grants + RLS)
--   * Service-role-only writes for leads, audit logs and staff accounts – SRS §30.3
-- ============================================================================

-- ---------- Types -----------------------------------------------------------
create type public.user_role as enum (
  'super_admin','ceo','operations_manager','verification_officer','finance_officer',
  'marketing_officer','support_officer','transporter','cargo_owner','driver','affiliate','broker'
);
create type public.account_status as enum ('pending_contact_verification','active','limited','suspended');
create type public.verification_status as enum ('unverified','under_review','verified','rejected','expired');
create type public.lead_type as enum ('general','cargo_owner','transporter','driver_help','partner','newsletter');
create type public.lead_status as enum ('new','contacted','qualified','converted','lost','spam');

-- ---------- Tables ----------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'cargo_owner',
  status public.account_status not null default 'pending_contact_verification',
  full_name text not null,
  email text,
  phone text unique,
  country text,
  locale text not null default 'en' check (locale in ('en','sw','fr')),
  marketing_consent boolean not null default false,
  terms_version text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cargo_owners (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text,
  country text,
  verification_status public.verification_status not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transporter_companies (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete restrict,
  registered_name text not null,
  trading_name text,
  registration_number text,
  country text,
  verification_status public.verification_status not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_members (
  company_id uuid not null references public.transporter_companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null check (member_role in ('owner','administrator','fleet_manager','dispatcher','member')),
  created_at timestamptz not null default now(),
  primary key (company_id, profile_id)
);

create table public.staff_accounts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9._-]{3,40}$'),
  active boolean not null default true,
  must_change_password boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.referral_codes (
  code text primary key check (code ~ '^[A-Z0-9-]{4,24}$'),
  partner_profile_id uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.referral_attributions (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null references public.referral_codes(code),
  referred_profile_id uuid not null unique references public.profiles(id) on delete cascade,
  introduced_at timestamptz not null default now(),
  window_ends_at timestamptz not null,           -- 60-day first-qualifying-booking window (SRS §21.6)
  status text not null default 'pending' check (status in ('pending','qualified','expired','rejected')),
  first_qualifying_booking_at timestamptz
);

create sequence public.lead_ref_seq;
create table public.marketing_leads (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default ('ENC-L-' || to_char(now(),'YYMM') || '-' || lpad(nextval('public.lead_ref_seq')::text, 5, '0')),
  lead_type public.lead_type not null default 'general',
  full_name text not null,
  company text,
  email text not null,
  phone text,
  country text,
  business_category text,
  corridor text,
  message text,
  source text not null default 'website_form',   -- SRS §25.3
  utm jsonb not null default '{}'::jsonb,
  locale text not null default 'en',
  consent boolean not null default false,
  updates_opt_in boolean not null default false,
  status public.lead_status not null default 'new',
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index on public.profiles (role, status);
create index on public.transporter_companies (owner_profile_id);
create index on public.company_members (profile_id);
create index on public.marketing_leads (status, created_at desc);
create index on public.marketing_leads (assigned_to);
create index on public.referral_codes (partner_profile_id);
create index on public.referral_attributions (referral_code);
create index on public.staff_accounts (created_by);
create index on public.audit_logs (actor_id, created_at desc);
create index on public.audit_logs (action, created_at desc);

-- ---------- Helper functions (SECURITY DEFINER avoids RLS recursion) ---------
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_cargo_owners_updated before update on public.cargo_owners for each row execute function public.set_updated_at();
create trigger trg_companies_updated before update on public.transporter_companies for each row execute function public.set_updated_at();

create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.status <> 'suspended'
      and p.role in ('super_admin','ceo','operations_manager','verification_officer','finance_officer','marketing_officer','support_officer')
  )
$$;

create function public.has_role(roles public.user_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.status <> 'suspended' and p.role = any(roles))
$$;

create function public.is_company_member(cid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.company_members m where m.company_id = cid and m.profile_id = (select auth.uid()))
$$;

create function public.is_company_admin(cid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.company_members m where m.company_id = cid and m.profile_id = (select auth.uid())
                 and m.member_role in ('owner','administrator'))
$$;

-- ---------- New-user trigger -------------------------------------------------
-- Creates the profile and the role record. User-supplied metadata is NOT trusted:
-- only the two public roles are honoured, nothing is ever created as verified.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role public.user_role;
  v_status public.account_status;
  v_company uuid;
  v_name text := left(coalesce(nullif(trim(meta->>'full_name'), ''), split_part(coalesce(new.email, 'user'), '@', 1)), 80);
  v_country text := nullif(meta->>'country', '');
  v_ref text := upper(nullif(trim(meta->>'referral_code'), ''));
  v_partner uuid;
begin
  v_role := case when meta->>'account_type' = 'transporter' then 'transporter'::public.user_role
                 else 'cargo_owner'::public.user_role end;
  v_status := case when new.email_confirmed_at is not null then 'limited'::public.account_status
                   else 'pending_contact_verification'::public.account_status end;

  insert into public.profiles (id, role, status, full_name, email, phone, country, locale,
                               marketing_consent, terms_version, terms_accepted_at)
  values (new.id, v_role, v_status, v_name, new.email, nullif(meta->>'phone', ''), v_country,
          case when meta->>'locale' in ('en','sw','fr') then meta->>'locale' else 'en' end,
          coalesce(meta->>'marketing_consent', 'false') = 'true',
          nullif(meta->>'terms_version', ''),
          nullif(meta->>'terms_accepted_at', '')::timestamptz);

  if v_role = 'transporter' then
    insert into public.transporter_companies (owner_profile_id, registered_name, country)
    values (new.id, left(coalesce(nullif(trim(meta->>'business_name'), ''), v_name), 120), v_country)
    returning id into v_company;
    insert into public.company_members (company_id, profile_id, member_role) values (v_company, new.id, 'owner');
  else
    insert into public.cargo_owners (profile_id, business_name, country)
    values (new.id, nullif(left(trim(coalesce(meta->>'business_name', '')), 120), ''), v_country);
  end if;

  if v_ref is not null then
    select partner_profile_id into v_partner from public.referral_codes where code = v_ref and active;
    if v_partner is not null and v_partner <> new.id then            -- no self-referral (SRS §21.12)
      insert into public.referral_attributions (referral_code, referred_profile_id, window_ends_at)
      values (v_ref, new.id, now() + interval '60 days')
      on conflict (referred_profile_id) do nothing;
    end if;
  end if;

  insert into public.audit_logs (actor_id, action, entity, entity_id, metadata)
  values (new.id, 'account_created', 'profiles', new.id::text,
          jsonb_build_object('role', v_role, 'referral_applied', v_partner is not null));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Contact verification moves the account from "pending" to "limited" (never to verified).
create function public.handle_user_confirmed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles set status = 'limited'
      where id = new.id and status = 'pending_contact_verification';
    insert into public.audit_logs (actor_id, action, entity, entity_id)
    values (new.id, 'contact_verified', 'profiles', new.id::text);
  end if;
  return new;
end $$;

create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
for each row execute function public.handle_user_confirmed();

-- ---------- Privileges & Row-Level Security ---------------------------------
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_staff(), public.has_role(public.user_role[]),
  public.is_company_member(uuid), public.is_company_admin(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.cargo_owners enable row level security;
alter table public.transporter_companies enable row level security;
alter table public.company_members enable row level security;
alter table public.staff_accounts enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_attributions enable row level security;
alter table public.marketing_leads enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: read own (staff read all); users may edit only harmless columns.
grant select on public.profiles to authenticated;
grant update (full_name, locale, marketing_consent) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_staff());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- cargo owners
grant select on public.cargo_owners to authenticated;
grant update (business_name, country) on public.cargo_owners to authenticated;
create policy cargo_owners_select on public.cargo_owners for select to authenticated
  using (profile_id = (select auth.uid()) or public.is_staff());
create policy cargo_owners_update_own on public.cargo_owners for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- transporter companies: members read, owners/administrators edit profile fields (never verification).
grant select on public.transporter_companies to authenticated;
grant update (registered_name, trading_name, registration_number, country) on public.transporter_companies to authenticated;
create policy companies_select on public.transporter_companies for select to authenticated
  using (owner_profile_id = (select auth.uid()) or public.is_company_member(id) or public.is_staff());
create policy companies_update on public.transporter_companies for update to authenticated
  using (public.is_company_admin(id)) with check (public.is_company_admin(id));

grant select on public.company_members to authenticated;
create policy members_select on public.company_members for select to authenticated
  using (profile_id = (select auth.uid()) or public.is_company_admin(company_id) or public.is_staff());

-- partners see their own codes and the referrals made with them
grant select on public.referral_codes to authenticated;
create policy referral_codes_select on public.referral_codes for select to authenticated
  using (partner_profile_id = (select auth.uid()) or public.is_staff());
grant select on public.referral_attributions to authenticated;
create policy referral_attr_select on public.referral_attributions for select to authenticated
  using (public.is_staff() or exists (
    select 1 from public.referral_codes rc where rc.code = referral_code and rc.partner_profile_id = (select auth.uid())));

-- leads: staff in commercial/support/admin roles only; inserts happen server-side with the service role.
grant select, update on public.marketing_leads to authenticated;
create policy leads_select on public.marketing_leads for select to authenticated
  using (public.has_role(array['super_admin','ceo','operations_manager','marketing_officer','support_officer']::public.user_role[]));
create policy leads_update on public.marketing_leads for update to authenticated
  using (public.has_role(array['super_admin','operations_manager','marketing_officer','support_officer']::public.user_role[]))
  with check (public.has_role(array['super_admin','operations_manager','marketing_officer','support_officer']::public.user_role[]));

-- audit trail: readable by executive/admin only; written by the service role; never editable.
grant select on public.audit_logs to authenticated;
create policy audit_select on public.audit_logs for select to authenticated
  using (public.has_role(array['super_admin','ceo']::public.user_role[]));

-- staff accounts: a staff member sees their own record; only Super Admin lists all.
grant select on public.staff_accounts to authenticated;
create policy staff_select on public.staff_accounts for select to authenticated
  using (profile_id = (select auth.uid()) or public.has_role(array['super_admin']::public.user_role[]));
