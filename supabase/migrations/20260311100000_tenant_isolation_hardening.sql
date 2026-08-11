-- Phase 2: tenant isolation hardening
-- Closes privilege-escalation and cross-tenant FK gaps found in the security audit.
-- Extends existing policies; does not weaken Platform Admin paths.

-- ---------------------------------------------------------------------------
-- 1) CRITICAL: prevent clients from self-granting is_platform_admin / status
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' then
    if NEW.is_platform_admin is distinct from OLD.is_platform_admin
       or NEW.status is distinct from OLD.status then
      -- Service role (Dashboard / trusted jobs) may change privileged fields.
      if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
        raise exception 'Cannot modify privileged profile fields'
          using errcode = '42501';
      end if;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists profiles_protect_privileged_columns on public.profiles;
create trigger profiles_protect_privileged_columns
before update on public.profiles
for each row
execute function public.protect_profile_privileged_columns();

revoke all on function public.protect_profile_privileged_columns() from public;

-- ---------------------------------------------------------------------------
-- 2) CRITICAL: only Platform Admins may create organisations
-- ---------------------------------------------------------------------------
drop policy if exists "organisations_insert_authenticated" on public.organisations;

create policy "organisations_insert_platform_admin"
on public.organisations
for insert
to authenticated
with check (public.is_platform_admin());

-- Allow Platform Admin rollback / cleanup (authenticated path still RLS-bound)
drop policy if exists "organisations_delete_platform_admin" on public.organisations;
create policy "organisations_delete_platform_admin"
on public.organisations
for delete
to authenticated
using (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 3) HIGH: linked employees cannot change tenancy / status via self-update
-- Org admins and Platform Admins remain able to change those columns.
-- ---------------------------------------------------------------------------
create or replace function public.protect_employee_tenancy_columns()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if TG_OP <> 'UPDATE' then
    return NEW;
  end if;

  -- Full access for Platform Admin or organisation admin of the employee org
  if public.is_platform_admin()
     or public.has_org_role(
       OLD.organisation_id,
       array['organisation_admin']::public.membership_role[]
     ) then
    return NEW;
  end if;

  -- Linked employee self-update path: lock tenancy / assignment / status
  if OLD.user_id is not null and OLD.user_id = auth.uid() then
    if NEW.organisation_id is distinct from OLD.organisation_id
       or NEW.user_id is distinct from OLD.user_id
       or NEW.status is distinct from OLD.status
       or NEW.brand_id is distinct from OLD.brand_id
       or NEW.location_id is distinct from OLD.location_id then
      raise exception 'Employees cannot change tenancy or assignment fields'
        using errcode = '42501';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists employees_protect_tenancy_columns on public.employees;
create trigger employees_protect_tenancy_columns
before update on public.employees
for each row
execute function public.protect_employee_tenancy_columns();

revoke all on function public.protect_employee_tenancy_columns() from public;

-- ---------------------------------------------------------------------------
-- 4) HIGH: same-organisation integrity for marque / brand assignments
-- ---------------------------------------------------------------------------
create or replace function public.enforce_same_org_location_brand()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  location_org uuid;
  brand_org uuid;
begin
  select organisation_id into location_org
  from public.locations
  where id = NEW.location_id;

  select organisation_id into brand_org
  from public.brands
  where id = NEW.brand_id;

  if location_org is null or brand_org is null then
    raise exception 'Invalid location or brand reference'
      using errcode = '23503';
  end if;

  if location_org <> brand_org then
    raise exception 'Brand and location must belong to the same organisation'
      using errcode = '23514';
  end if;

  return NEW;
end;
$$;

drop trigger if exists location_brands_same_org on public.location_brands;
create trigger location_brands_same_org
before insert or update on public.location_brands
for each row
execute function public.enforce_same_org_location_brand();

create or replace function public.enforce_same_org_employee_brand()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  employee_org uuid;
  brand_org uuid;
begin
  select organisation_id into employee_org
  from public.employees
  where id = NEW.employee_id;

  select organisation_id into brand_org
  from public.brands
  where id = NEW.brand_id;

  if employee_org is null or brand_org is null then
    raise exception 'Invalid employee or brand reference'
      using errcode = '23503';
  end if;

  if employee_org <> brand_org then
    raise exception 'Brand and employee must belong to the same organisation'
      using errcode = '23514';
  end if;

  return NEW;
end;
$$;

drop trigger if exists employee_brands_same_org on public.employee_brands;
create trigger employee_brands_same_org
before insert or update on public.employee_brands
for each row
execute function public.enforce_same_org_employee_brand();

-- employees.brand_id / location_id must match employee organisation
create or replace function public.enforce_employee_org_assignments()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  related_org uuid;
begin
  if NEW.brand_id is not null then
    select organisation_id into related_org
    from public.brands
    where id = NEW.brand_id;

    if related_org is null or related_org <> NEW.organisation_id then
      raise exception 'Employee brand must belong to the same organisation'
        using errcode = '23514';
    end if;
  end if;

  if NEW.location_id is not null then
    select organisation_id into related_org
    from public.locations
    where id = NEW.location_id;

    if related_org is null or related_org <> NEW.organisation_id then
      raise exception 'Employee location must belong to the same organisation'
        using errcode = '23514';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists employees_enforce_org_assignments on public.employees;
create trigger employees_enforce_org_assignments
before insert or update on public.employees
for each row
execute function public.enforce_employee_org_assignments();

-- cards.employee_id must belong to the same organisation
create or replace function public.enforce_card_employee_same_org()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  employee_org uuid;
begin
  select organisation_id into employee_org
  from public.employees
  where id = NEW.employee_id;

  if employee_org is null or employee_org <> NEW.organisation_id then
    raise exception 'Card employee must belong to the same organisation'
      using errcode = '23514';
  end if;

  return NEW;
end;
$$;

drop trigger if exists cards_enforce_employee_same_org on public.cards;
create trigger cards_enforce_employee_same_org
before insert or update on public.cards
for each row
execute function public.enforce_card_employee_same_org();

-- brand_kits.brand_id must belong to same organisation when set
create or replace function public.enforce_brand_kit_brand_same_org()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  brand_org uuid;
begin
  if NEW.brand_id is null then
    return NEW;
  end if;

  select organisation_id into brand_org
  from public.brands
  where id = NEW.brand_id;

  if brand_org is null or brand_org <> NEW.organisation_id then
    raise exception 'Brand kit brand must belong to the same organisation'
      using errcode = '23514';
  end if;

  return NEW;
end;
$$;

drop trigger if exists brand_kits_enforce_brand_same_org on public.brand_kits;
create trigger brand_kits_enforce_brand_same_org
before insert or update on public.brand_kits
for each row
execute function public.enforce_brand_kit_brand_same_org();

revoke all on function public.enforce_same_org_location_brand() from public;
revoke all on function public.enforce_same_org_employee_brand() from public;
revoke all on function public.enforce_employee_org_assignments() from public;
revoke all on function public.enforce_card_employee_same_org() from public;
revoke all on function public.enforce_brand_kit_brand_same_org() from public;

-- Tighten marque write policies: require brand same-org in WITH CHECK
-- and include Platform Admin (previously missing).
drop policy if exists location_brands_write_admin on public.location_brands;
create policy location_brands_write_admin on public.location_brands
  for all to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1
      from public.locations l
      join public.memberships m on m.organisation_id = l.organisation_id
      where l.id = location_brands.location_id
        and m.user_id = auth.uid()
        and m.role in ('organisation_admin', 'brand_admin', 'location_admin')
    )
  )
  with check (
    public.is_platform_admin()
    or (
      exists (
        select 1
        from public.locations l
        join public.memberships m on m.organisation_id = l.organisation_id
        where l.id = location_brands.location_id
          and m.user_id = auth.uid()
          and m.role in ('organisation_admin', 'brand_admin', 'location_admin')
      )
      and exists (
        select 1
        from public.locations l
        join public.brands b on b.id = location_brands.brand_id
        where l.id = location_brands.location_id
          and b.organisation_id = l.organisation_id
      )
    )
  );

drop policy if exists location_brands_select_member on public.location_brands;
create policy location_brands_select_member on public.location_brands
  for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1
      from public.locations l
      join public.memberships m on m.organisation_id = l.organisation_id
      where l.id = location_brands.location_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists employee_brands_write_admin on public.employee_brands;
create policy employee_brands_write_admin on public.employee_brands
  for all to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1
      from public.employees e
      join public.memberships m on m.organisation_id = e.organisation_id
      where e.id = employee_brands.employee_id
        and m.user_id = auth.uid()
        and m.role in ('organisation_admin', 'brand_admin', 'location_admin')
    )
  )
  with check (
    public.is_platform_admin()
    or (
      exists (
        select 1
        from public.employees e
        join public.memberships m on m.organisation_id = e.organisation_id
        where e.id = employee_brands.employee_id
          and m.user_id = auth.uid()
          and m.role in ('organisation_admin', 'brand_admin', 'location_admin')
      )
      and exists (
        select 1
        from public.employees e
        join public.brands b on b.id = employee_brands.brand_id
        where e.id = employee_brands.employee_id
          and b.organisation_id = e.organisation_id
      )
    )
  );

drop policy if exists employee_brands_select_member on public.employee_brands;
create policy employee_brands_select_member on public.employee_brands
  for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1
      from public.employees e
      join public.memberships m on m.organisation_id = e.organisation_id
      where e.id = employee_brands.employee_id
        and m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 5) HIGH: safer claim_employee_profile (fail closed on ambiguous email)
-- ---------------------------------------------------------------------------
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
  match_count integer;
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

  select count(*) into match_count
  from public.employees e
  where e.user_id is null
    and e.email is not null
    and lower(e.email) = lower(user_email)
    and e.status in ('active', 'draft', 'paused');

  -- Ambiguous cross-tenant email: do not auto-claim
  if match_count > 1 then
    raise exception 'Multiple employee profiles match this email; ask your admin to link your account';
  end if;

  if match_count = 0 then
    return null;
  end if;

  select e.id, e.organisation_id into emp_id, org_id
  from public.employees e
  where e.user_id is null
    and e.email is not null
    and lower(e.email) = lower(user_email)
    and e.status in ('active', 'draft', 'paused')
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
