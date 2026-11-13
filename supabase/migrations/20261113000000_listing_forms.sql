-- ============================================================================
-- Listing forms: customers post cargo requests and register trucks.
--
-- ADDITIVE: new sequences, columns, functions, policies, triggers and one new
-- table. Existing rows and policies are untouched.
--
-- Safety model
--   * Customers can only create listings in 'draft' or 'pending_review'. Only
--     staff can publish (status = 'published'); that is enforced by RLS, not
--     by the application.
--   * A cargo owner can post loads; a transporter administrator can register
--     trucks for their own company. Suspended / unconfirmed accounts cannot.
--   * Customers cannot touch review fields (reviewed_by, rejected_reason, ...)
--     or mark rows as samples; a trigger resets them.
--   * Private details (company, contacts, plates, addresses) stay in the
--     *_private tables, readable only by verified accounts, the owner and staff.
-- ============================================================================

-- ---------- Reference numbers (EN-L-3001, EN-T-3001, ...) --------------------
-- Sample listings use 2041-2060 / 1108-1132, so real references start at 3001.
create sequence public.cargo_ref_seq start 3001;
create sequence public.truck_ref_seq start 3001;
alter table public.cargo_requests alter column reference set default ('EN-L-' || nextval('public.cargo_ref_seq')::text);
alter table public.trucks alter column reference set default ('EN-T-' || nextval('public.truck_ref_seq')::text);
grant usage on sequence public.cargo_ref_seq, public.truck_ref_seq to authenticated;

-- ---------- Review bookkeeping (used by the staff screens later) -------------
alter table public.cargo_requests
  add column published_at timestamptz,
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references public.profiles(id) on delete set null,
  add column rejected_reason text;
alter table public.trucks
  add column published_at timestamptz,
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references public.profiles(id) on delete set null,
  add column rejected_reason text;

-- ---------- Extra private details --------------------------------------------
alter table public.cargo_request_private
  add column declared_value_usd integer check (declared_value_usd >= 0),
  add column private_notes text;
alter table public.truck_private
  add column plate_number text,
  add column trailer_plate text,
  add column insurance_expiry date;

-- ---------- Helper functions --------------------------------------------------
create function private.account_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.status in ('limited','active'))
$$;

create function private.can_post_loads() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p join public.cargo_owners c on c.profile_id = p.id
                 where p.id = (select auth.uid()) and p.role = 'cargo_owner' and p.status in ('limited','active'))
$$;

-- Customers cannot set review fields, mark rows as samples, change references or reassign owners.
-- Staff and trusted server-side jobs (no signed-in user) are not restricted.
create function private.protect_listing_fields() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null and not private.is_staff() then
    if tg_op = 'INSERT' then
      new.reviewed_by := null; new.reviewed_at := null; new.rejected_reason := null; new.published_at := null;
    else
      new.reviewed_by := old.reviewed_by; new.reviewed_at := old.reviewed_at;
      new.rejected_reason := old.rejected_reason; new.published_at := old.published_at;
      new.is_sample := old.is_sample; new.reference := old.reference;
      if tg_table_name = 'cargo_requests' then new.owner_profile_id := old.owner_profile_id;
      else new.company_id := old.company_id; end if;
    end if;
  end if;
  return new;
end $$;

create trigger trg_cargo_requests_protect before insert or update on public.cargo_requests
  for each row execute function private.protect_listing_fields();
create trigger trg_trucks_protect before insert or update on public.trucks
  for each row execute function private.protect_listing_fields();

-- ---------- Cargo requests: owners create / edit / close their own ------------
create policy cargo_requests_owner_insert on public.cargo_requests for insert to authenticated
  with check (
    owner_profile_id = (select auth.uid())
    and is_sample = false
    and status in ('draft','pending_review')
    and private.can_post_loads()
  );
create policy cargo_requests_owner_update on public.cargo_requests for update to authenticated
  using (owner_profile_id = (select auth.uid()) and status in ('draft','pending_review','published','rejected'))
  with check (
    owner_profile_id = (select auth.uid())
    and is_sample = false
    and status in ('draft','pending_review','closed')   -- never 'published': only staff publish
    and private.can_post_loads()
  );

create policy cargo_request_private_owner_insert on public.cargo_request_private for insert to authenticated
  with check (exists (select 1 from public.cargo_requests r
                      where r.id = cargo_request_id and r.owner_profile_id = (select auth.uid()) and r.status in ('draft','pending_review')));
create policy cargo_request_private_owner_update on public.cargo_request_private for update to authenticated
  using (exists (select 1 from public.cargo_requests r where r.id = cargo_request_id and r.owner_profile_id = (select auth.uid())))
  with check (exists (select 1 from public.cargo_requests r where r.id = cargo_request_id and r.owner_profile_id = (select auth.uid())));

-- ---------- Trucks: company administrators register / edit / withdraw ---------
create policy trucks_company_insert on public.trucks for insert to authenticated
  with check (
    company_id is not null
    and is_sample = false
    and status in ('draft','pending_review')
    and private.account_active()
    and private.is_company_admin(company_id)
  );
create policy trucks_company_update on public.trucks for update to authenticated
  using (company_id is not null and private.is_company_admin(company_id) and status in ('draft','pending_review','published','rejected'))
  with check (
    company_id is not null
    and is_sample = false
    and status in ('draft','pending_review','closed')
    and private.account_active()
    and private.is_company_admin(company_id)
  );

create policy truck_private_company_insert on public.truck_private for insert to authenticated
  with check (exists (select 1 from public.trucks t
                      where t.id = truck_id and t.company_id is not null and private.is_company_admin(t.company_id) and t.status in ('draft','pending_review')));
create policy truck_private_company_update on public.truck_private for update to authenticated
  using (exists (select 1 from public.trucks t where t.id = truck_id and t.company_id is not null and private.is_company_admin(t.company_id)))
  with check (exists (select 1 from public.trucks t where t.id = truck_id and t.company_id is not null and private.is_company_admin(t.company_id)));

-- ---------- Truck documents (registration card, insurance, permits, ...) ------
-- Files live in the private 'truck-documents' storage bucket; this table records them.
create table public.truck_documents (
  id uuid primary key default gen_random_uuid(),
  truck_id uuid not null references public.trucks(id) on delete cascade,
  doc_type text not null check (doc_type in ('registration_card','insurance','transit_permit','comesa_yellow_card','inspection','tank_certificate','hazmat_certificate','other')),
  storage_path text not null unique,
  file_name text not null check (length(file_name) between 1 and 200),
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png','image/webp')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);
create index on public.truck_documents (truck_id);

alter table public.truck_documents enable row level security;
grant select, insert, delete on public.truck_documents to authenticated;

create policy truck_documents_read on public.truck_documents for select to authenticated
  using (private.is_staff() or exists (select 1 from public.trucks t where t.id = truck_id and t.company_id is not null and private.is_company_member(t.company_id)));
create policy truck_documents_insert on public.truck_documents for insert to authenticated
  with check (exists (select 1 from public.trucks t where t.id = truck_id and t.company_id is not null and private.is_company_admin(t.company_id)));
create policy truck_documents_delete on public.truck_documents for delete to authenticated
  using (private.is_staff() or exists (select 1 from public.trucks t where t.id = truck_id and t.company_id is not null and private.is_company_admin(t.company_id)));
