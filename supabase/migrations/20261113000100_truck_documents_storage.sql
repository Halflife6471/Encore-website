-- Private storage bucket for truck documents. Kept in its own migration because it needs Supabase's
-- `storage` schema (not available in the local test database).
--
-- Path convention:  <company_id>/<truck_id>/<doc_type>-<timestamp>.<ext>
-- Only members of that company (and staff) can read; only company administrators can upload / delete.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('truck-documents', 'truck-documents', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy truck_documents_obj_read on storage.objects for select to authenticated
  using (
    bucket_id = 'truck-documents'
    and (
      private.is_staff()
      or case when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then private.is_company_member(((storage.foldername(name))[1])::uuid) else false end
    )
  );

create policy truck_documents_obj_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'truck-documents'
    and case when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             then private.is_company_admin(((storage.foldername(name))[1])::uuid) else false end
  );

create policy truck_documents_obj_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'truck-documents'
    and (
      private.is_staff()
      or case when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then private.is_company_admin(((storage.foldername(name))[1])::uuid) else false end
    )
  );
