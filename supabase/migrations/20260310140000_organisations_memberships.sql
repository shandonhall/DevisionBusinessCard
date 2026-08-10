-- Milestone 1: Authentication + Tenancy
-- organisations, profiles, memberships + RLS helpers

create extension if not exists "pgcrypto";

create type public.organisation_status as enum (
  'draft',
  'active',
  'suspended',
  'archived'
);

create type public.membership_role as enum (
  'organisation_admin',
  'brand_admin',
  'location_admin',
  'employee'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  is_platform_admin boolean not null default false,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  legal_name text,
  website text,
  status public.organisation_status not null default 'draft',
  default_brand_id uuid,
  plan_id uuid,
  white_label_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organisations_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint organisations_slug_length check (
    char_length(slug) between 2 and 60
  )
);

create unique index organisations_slug_unique on public.organisations (slug);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  brand_id uuid,
  location_id uuid,
  role public.membership_role not null default 'organisation_admin',
  created_at timestamptz not null default now(),
  constraint memberships_user_org_unique unique (user_id, organisation_id)
);

create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_organisation_id_idx on public.memberships (organisation_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger organisations_set_updated_at
before update on public.organisations
for each row execute function public.set_updated_at();

-- Create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Security helper: current user is a platform super admin.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_platform_admin = true
      and p.status = 'active'
  );
$$;

-- Security helper: membership in a tenant (any role).
create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organisation_id = target_org_id
      and m.user_id = auth.uid()
  );
$$;

-- Security helper: membership with one of the allowed roles.
create or replace function public.has_org_role(
  target_org_id uuid,
  allowed_roles public.membership_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organisation_id = target_org_id
      and m.user_id = auth.uid()
      and m.role = any (allowed_roles)
  );
$$;

revoke all on function public.is_platform_admin() from public;
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, public.membership_role[]) from public;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.membership_role[]) to authenticated;

alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.memberships enable row level security;

-- Profiles
create policy "profiles_select_own_or_platform"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_platform_admin()
);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Organisations
create policy "organisations_select_member_or_platform"
on public.organisations
for select
to authenticated
using (
  public.is_platform_admin()
  or public.is_org_member(id)
);

create policy "organisations_insert_authenticated"
on public.organisations
for insert
to authenticated
with check (auth.uid() is not null);

create policy "organisations_update_admin_or_platform"
on public.organisations
for update
to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(id, array['organisation_admin']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(id, array['organisation_admin']::public.membership_role[])
);

-- Memberships
create policy "memberships_select_own_org_or_platform"
on public.memberships
for select
to authenticated
using (
  public.is_platform_admin()
  or user_id = auth.uid()
  or public.is_org_member(organisation_id)
);

create policy "memberships_insert_admin_or_self_bootstrap"
on public.memberships
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(
    organisation_id,
    array['organisation_admin']::public.membership_role[]
  )
  -- Allow the creator to attach themselves as the first org admin.
  or (
    user_id = auth.uid()
    and role = 'organisation_admin'
    and not exists (
      select 1
      from public.memberships existing
      where existing.organisation_id = organisation_id
    )
  )
);

create policy "memberships_update_admin_or_platform"
on public.memberships
for update
to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(
    organisation_id,
    array['organisation_admin']::public.membership_role[]
  )
)
with check (
  public.is_platform_admin()
  or public.has_org_role(
    organisation_id,
    array['organisation_admin']::public.membership_role[]
  )
);

create policy "memberships_delete_admin_or_platform"
on public.memberships
for delete
to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(
    organisation_id,
    array['organisation_admin']::public.membership_role[]
  )
);
