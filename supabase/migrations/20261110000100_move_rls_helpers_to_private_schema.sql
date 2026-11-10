-- RLS helper functions live in a schema that is NOT exposed through the REST API,
-- so they cannot be called via /rest/v1/rpc, while policies can still use them.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.is_staff() set schema private;
alter function public.has_role(public.user_role[]) set schema private;
alter function public.is_company_member(uuid) set schema private;
alter function public.is_company_admin(uuid) set schema private;
