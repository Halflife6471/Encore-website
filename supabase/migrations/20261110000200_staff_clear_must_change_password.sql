-- A staff member may clear their own "must change password" flag after setting a new password.
-- They cannot touch any other column or any other staff record.
grant update (must_change_password) on public.staff_accounts to authenticated;
create policy staff_clear_must_change on public.staff_accounts for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()) and must_change_password = false);
