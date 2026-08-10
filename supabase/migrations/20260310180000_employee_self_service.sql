-- Milestone: employee self-service + profile photo storage paths

-- One login account → at most one employee profile
create unique index if not exists employees_user_id_unique
  on public.employees (user_id)
  where user_id is not null;

create index if not exists employees_email_lower_idx
  on public.employees (organisation_id, lower(email))
  where email is not null;

-- Employees may update their own linked profile (app limits which fields change)
create policy "employees_update_own_linked"
on public.employees
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Claim an unlinked employee row that matches the signed-in email
create or replace function public.claim_employee_profile()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  user_email text;
  emp_id uuid;
  org_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select email into user_email
  from auth.users
  where id = uid;

  if user_email is null or length(trim(user_email)) = 0 then
    raise exception 'No email on account';
  end if;

  -- Already linked?
  select id into emp_id
  from public.employees
  where user_id = uid
  limit 1;

  if emp_id is not null then
    return emp_id;
  end if;

  select e.id, e.organisation_id into emp_id, org_id
  from public.employees e
  where e.user_id is null
    and e.email is not null
    and lower(e.email) = lower(user_email)
    and e.status in ('active', 'draft', 'paused')
  order by e.updated_at desc
  limit 1
  for update;

  if emp_id is null then
    return null;
  end if;

  update public.employees
  set user_id = uid
  where id = emp_id;

  insert into public.memberships (user_id, organisation_id, role)
  values (uid, org_id, 'employee')
  on conflict (user_id, organisation_id) do nothing;

  return emp_id;
end;
$$;

revoke all on function public.claim_employee_profile() from public;
grant execute on function public.claim_employee_profile() to authenticated;

-- Storage: allow linked employees to manage their own photo path
-- Path: {organisation_id}/employees/{employee_id}/{filename}
create policy "organisation_assets_insert_own_employee"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'organisation-assets'
  and (storage.foldername(name))[2] = 'employees'
  and exists (
    select 1
    from public.employees e
    where e.id = nullif((storage.foldername(name))[3], '')::uuid
      and e.organisation_id = nullif((storage.foldername(name))[1], '')::uuid
      and e.user_id = auth.uid()
  )
);

create policy "organisation_assets_update_own_employee"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'organisation-assets'
  and (storage.foldername(name))[2] = 'employees'
  and exists (
    select 1
    from public.employees e
    where e.id = nullif((storage.foldername(name))[3], '')::uuid
      and e.organisation_id = nullif((storage.foldername(name))[1], '')::uuid
      and e.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'organisation-assets'
  and (storage.foldername(name))[2] = 'employees'
  and exists (
    select 1
    from public.employees e
    where e.id = nullif((storage.foldername(name))[3], '')::uuid
      and e.organisation_id = nullif((storage.foldername(name))[1], '')::uuid
      and e.user_id = auth.uid()
  )
);

create policy "organisation_assets_delete_own_employee"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'organisation-assets'
  and (storage.foldername(name))[2] = 'employees'
  and exists (
    select 1
    from public.employees e
    where e.id = nullif((storage.foldername(name))[3], '')::uuid
      and e.organisation_id = nullif((storage.foldername(name))[1], '')::uuid
      and e.user_id = auth.uid()
  )
);
