-- ============================================================================
-- Marketplace listings (cargo requests + truck capacity)
--
-- ADDITIVE ONLY: creates new tables and one helper function. Nothing that
-- exists today is altered or dropped.
--
-- Visibility model (enforced here by row-level security, not just by the UI):
--   PUBLIC  (anyone, incl. signed-out visitors) .. route, cargo, weight, vehicle,
--                                                  schedule, requirements, PRICES
--   PRIVATE (verified accounts, owner, staff) .... company identity, contact
--                                                  details, exact addresses
-- Public and private data live in separate tables so Postgres can hide the
-- private columns completely (RLS is row-level, not column-level).
-- ============================================================================

-- ---------- Who may see private details -------------------------------------
-- Verified = a verified cargo owner, a member of a verified transporter company, or staff.
create function private.is_verified_account() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_staff()
    or exists (select 1 from public.cargo_owners c
               where c.profile_id = (select auth.uid()) and c.verification_status = 'verified')
    or exists (select 1 from public.transporter_companies t
               join public.company_members m on m.company_id = t.id
               where m.profile_id = (select auth.uid()) and t.verification_status = 'verified')
$$;

-- ---------- Cargo requests (loads) ------------------------------------------
create table public.cargo_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status text not null default 'pending_review'
    check (status in ('draft','pending_review','published','closed','rejected')),
  is_sample boolean not null default false,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  corridor text not null check (corridor in ('tz-zm','tz-cd','tz-mw','tz-rw-bi','northern','tz-ke','domestic')),
  origin_city text not null,
  origin_country text not null check (origin_country in ('TZ','ZM','CD','KE','UG','RW','BI','MW')),
  destination_city text not null,
  destination_country text not null check (destination_country in ('TZ','ZM','CD','KE','UG','RW','BI','MW')),
  distance_km integer not null check (distance_km > 0),
  transit_days_min integer not null check (transit_days_min >= 0),
  transit_days_max integer not null check (transit_days_max >= transit_days_min),
  borders text[] not null default '{}',
  commodity_en text not null,
  commodity_sw text,
  cargo_type text not null check (cargo_type in ('general','agri_inputs','food','construction','minerals','chemicals','fuel','steel','machinery','pharma','fmcg','heavy')),
  packaging text not null check (packaging in ('bagged','palletised','containerised','bulk','liquid','coils','oversize','loose')),
  weight_t numeric(8,1) not null check (weight_t > 0),
  volume_cbm numeric(8,1) check (volume_cbm > 0),
  piece_dimensions text,
  vehicle_type text not null check (vehicle_type in ('flatbed','curtainside','container','tipper','fuel_tanker','chem_tanker','reefer','box','lowbed','bulk')),
  trucks_needed integer not null default 1 check (trucks_needed >= 1),
  -- Real listings use absolute dates. Sample listings use day offsets from "today" so they never go stale.
  pickup_from date,
  pickup_to date,
  deliver_by date,
  pickup_from_offset integer,
  pickup_to_offset integer,
  deliver_by_offset integer,
  posted_hours_ago integer,                       -- sample listings only
  budget_min_usd integer check (budget_min_usd >= 0),
  budget_max_usd integer check (budget_max_usd >= budget_min_usd),
  temp_min_c numeric(5,1),
  temp_max_c numeric(5,1),
  hazmat_class text,
  requirements text[] not null default '{}'
    check (requirements <@ array['gps','tarpaulin','twistlocks','escort','hazmat','temp_log','insurance','vetted_driver','pod_photos','comesa','permits','reefer_unit']),
  documents text[] not null default '{}'
    check (documents <@ array['commercial_invoice','packing_list','bill_of_lading','t1','coo','sds','phyto']),
  note_en text,
  note_sw text,
  urgent boolean not null default false,
  sector text check (sector in ('agri','manufacturing','mining','construction','retail','energy','pharma','trading')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_sample or (pickup_from is not null and pickup_to is not null and deliver_by is not null)),
  check (not is_sample or (pickup_from_offset is not null and pickup_to_offset is not null and deliver_by_offset is not null and posted_hours_ago is not null))
);

create table public.cargo_request_private (
  cargo_request_id uuid primary key references public.cargo_requests(id) on delete cascade,
  company_name text not null,
  contact_name text not null,
  contact_phone text not null,
  contact_email text not null,
  pickup_address text,
  delivery_address text
);

-- ---------- Trucks (capacity) -----------------------------------------------
create table public.trucks (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  status text not null default 'pending_review'
    check (status in ('draft','pending_review','published','closed','rejected')),
  is_sample boolean not null default false,
  company_id uuid references public.transporter_companies(id) on delete set null,
  vehicle_type text not null check (vehicle_type in ('flatbed','curtainside','container','tipper','fuel_tanker','chem_tanker','reefer','box','lowbed','bulk')),
  make_model text not null,
  year integer not null check (year between 1990 and 2100),
  axle_configuration text not null,
  payload_t numeric(8,1) not null check (payload_t > 0),
  body_spec text not null,
  location_city text not null,
  location_country text not null check (location_country in ('TZ','ZM','CD','KE','UG','RW','BI','MW')),
  available_from date,
  available_offset integer,                       -- sample listings only
  posted_hours_ago integer,                       -- sample listings only
  corridors text[] not null default '{}'
    check (corridors <@ array['tz-zm','tz-cd','tz-mw','tz-rw-bi','northern','tz-ke','domestic']),
  features text[] not null default '{}'
    check (features <@ array['gps','tarpaulin','twistlocks','escort','hazmat','temp_log','insurance','vetted_driver','pod_photos','comesa','permits','reefer_unit']),
  rate_min_usd_per_km numeric(5,2) check (rate_min_usd_per_km >= 0),
  rate_max_usd_per_km numeric(5,2) check (rate_max_usd_per_km >= rate_min_usd_per_km),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_sample or available_from is not null),
  check (not is_sample or (available_offset is not null and posted_hours_ago is not null))
);

create table public.truck_private (
  truck_id uuid primary key references public.trucks(id) on delete cascade,
  company_name text not null,
  contact_name text not null,
  contact_phone text not null,
  contact_email text not null,
  base_address text
);

-- ---------- Indexes ----------------------------------------------------------
create index on public.cargo_requests (status, created_at desc);
create index on public.cargo_requests (owner_profile_id);
create index on public.cargo_requests (corridor);
create index on public.trucks (status, created_at desc);
create index on public.trucks (company_id);
create index on public.trucks (vehicle_type);

create trigger trg_cargo_requests_updated before update on public.cargo_requests for each row execute function public.set_updated_at();
create trigger trg_trucks_updated before update on public.trucks for each row execute function public.set_updated_at();

-- ---------- Privileges & Row-Level Security ---------------------------------
alter table public.cargo_requests enable row level security;
alter table public.cargo_request_private enable row level security;
alter table public.trucks enable row level security;
alter table public.truck_private enable row level security;

-- PUBLIC tables: anyone may read published listings. Owners/staff also see their own / all rows.
grant select on public.cargo_requests, public.trucks to anon, authenticated;
grant insert, update, delete on public.cargo_requests, public.trucks to authenticated;   -- gated by the staff policies below

create policy cargo_requests_public_read on public.cargo_requests for select to anon, authenticated
  using (status = 'published');
create policy cargo_requests_owner_read on public.cargo_requests for select to authenticated
  using (owner_profile_id = (select auth.uid()));
create policy cargo_requests_staff_all on public.cargo_requests for all to authenticated
  using (private.is_staff()) with check (private.is_staff());

create policy trucks_public_read on public.trucks for select to anon, authenticated
  using (status = 'published');
create policy trucks_owner_read on public.trucks for select to authenticated
  using (company_id is not null and private.is_company_member(company_id));
create policy trucks_staff_all on public.trucks for all to authenticated
  using (private.is_staff()) with check (private.is_staff());

-- PRIVATE tables: signed-in verified accounts, the listing's owner, and staff. Never anonymous visitors.
grant select on public.cargo_request_private, public.truck_private to authenticated;
grant insert, update, delete on public.cargo_request_private, public.truck_private to authenticated;  -- gated by staff policies

create policy cargo_request_private_read on public.cargo_request_private for select to authenticated
  using (
    exists (select 1 from public.cargo_requests r
            where r.id = cargo_request_id
              and ((r.status = 'published' and private.is_verified_account())
                   or r.owner_profile_id = (select auth.uid())))
  );
create policy cargo_request_private_staff_all on public.cargo_request_private for all to authenticated
  using (private.is_staff()) with check (private.is_staff());

create policy truck_private_read on public.truck_private for select to authenticated
  using (
    exists (select 1 from public.trucks t
            where t.id = truck_id
              and ((t.status = 'published' and private.is_verified_account())
                   or (t.company_id is not null and private.is_company_member(t.company_id))))
  );
create policy truck_private_staff_all on public.truck_private for all to authenticated
  using (private.is_staff()) with check (private.is_staff());
