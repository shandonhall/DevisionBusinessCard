-- Milestone 3: Brands, locations, employees (+ FKs into existing tables)

create type public.entity_status as enum (
  'draft',
  'active',
  'archived'
);

create type public.location_type as enum (
  'branch',
  'dealership',
  'office',
  'department',
  'division',
  'region',
  'team'
);

create type public.employee_status as enum (
  'draft',
  'active',
  'paused',
  'archived'
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  name text not null,
  slug text not null,
  status public.entity_status not null default 'active',
  website text,
  logo_url text,
  brand_kit_id uuid references public.brand_kits (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint brands_slug_length check (char_length(slug) between 2 and 60),
  constraint brands_org_slug_unique unique (organisation_id, slug)
);

create index brands_organisation_id_idx on public.brands (organisation_id);

create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  parent_location_id uuid references public.locations (id) on delete set null,
  name text not null,
  slug text not null,
  type public.location_type not null default 'branch',
  address text,
  phone text,
  email text,
  website text,
  timezone text not null default 'Africa/Johannesburg',
  status public.entity_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint locations_slug_length check (char_length(slug) between 2 and 60),
  constraint locations_org_slug_unique unique (organisation_id, slug)
);

create index locations_organisation_id_idx on public.locations (organisation_id);
create index locations_brand_id_idx on public.locations (brand_id);

create trigger locations_set_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  brand_id uuid references public.brands (id) on delete set null,
  location_id uuid references public.locations (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  first_name text not null,
  last_name text not null,
  display_name text,
  job_title text,
  department text,
  email text,
  mobile text,
  whatsapp text,
  linkedin_url text,
  profile_photo_url text,
  bio text,
  status public.employee_status not null default 'active',
  employee_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index employees_organisation_id_idx on public.employees (organisation_id);
create index employees_brand_id_idx on public.employees (brand_id);
create index employees_location_id_idx on public.employees (location_id);
create index employees_status_idx on public.employees (organisation_id, status);
create index employees_name_search_idx on public.employees (
  organisation_id,
  lower(first_name),
  lower(last_name)
);

create trigger employees_set_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

-- Wire existing nullable brand references
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'brand_kits_brand_id_fkey'
  ) then
    alter table public.brand_kits
      add constraint brand_kits_brand_id_fkey
      foreign key (brand_id) references public.brands (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'organisations_default_brand_id_fkey'
  ) then
    alter table public.organisations
      add constraint organisations_default_brand_id_fkey
      foreign key (default_brand_id) references public.brands (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'memberships_brand_id_fkey'
  ) then
    alter table public.memberships
      add constraint memberships_brand_id_fkey
      foreign key (brand_id) references public.brands (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'memberships_location_id_fkey'
  ) then
    alter table public.memberships
      add constraint memberships_location_id_fkey
      foreign key (location_id) references public.locations (id) on delete set null;
  end if;
end $$;

alter table public.brands enable row level security;
alter table public.locations enable row level security;
alter table public.employees enable row level security;

-- Brands policies
create policy "brands_select_member_or_platform"
on public.brands for select to authenticated
using (
  public.is_platform_admin()
  or public.is_org_member(organisation_id)
);

create policy "brands_insert_admin_or_platform"
on public.brands for insert to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "brands_update_admin_or_platform"
on public.brands for update to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "brands_delete_admin_or_platform"
on public.brands for delete to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

-- Locations policies
create policy "locations_select_member_or_platform"
on public.locations for select to authenticated
using (
  public.is_platform_admin()
  or public.is_org_member(organisation_id)
);

create policy "locations_insert_admin_or_platform"
on public.locations for insert to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "locations_update_admin_or_platform"
on public.locations for update to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "locations_delete_admin_or_platform"
on public.locations for delete to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

-- Employees policies
create policy "employees_select_member_or_platform"
on public.employees for select to authenticated
using (
  public.is_platform_admin()
  or public.is_org_member(organisation_id)
);

create policy "employees_insert_admin_or_platform"
on public.employees for insert to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "employees_update_admin_or_platform"
on public.employees for update to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "employees_delete_admin_or_platform"
on public.employees for delete to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);
