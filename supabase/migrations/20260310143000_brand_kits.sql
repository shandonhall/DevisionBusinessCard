-- Milestone 2: Organisation defaults + brand kits + logo storage
-- brand_id stays nullable until Milestone 3 (brands)

alter table public.organisations
  add column if not exists default_brand_kit_id uuid;

create table if not exists public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  brand_id uuid,
  name text not null default 'Organisation default',
  primary_colour text not null default '#0F766E',
  secondary_colour text not null default '#134E4A',
  accent_colour text not null default '#D97706',
  background_colour text not null default '#F4F7F5',
  surface_colour text not null default '#FFFFFF',
  text_colour text not null default '#14201C',
  muted_text_colour text not null default '#5C6B64',
  heading_font text not null default 'Outfit',
  body_font text not null default 'Source Sans 3',
  button_radius text not null default '14px',
  card_radius text not null default '24px',
  border_style text not null default 'subtle',
  shadow_style text not null default 'soft',
  background_style text not null default 'solid',
  logo_url text,
  default_layout_id text not null default 'corporate'
    check (default_layout_id in ('executive', 'corporate', 'modern')),
  custom_css_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_kits_primary_colour_hex check (primary_colour ~ '^#[0-9A-Fa-f]{6}$'),
  constraint brand_kits_secondary_colour_hex check (secondary_colour ~ '^#[0-9A-Fa-f]{6}$'),
  constraint brand_kits_accent_colour_hex check (accent_colour ~ '^#[0-9A-Fa-f]{6}$'),
  constraint brand_kits_background_colour_hex check (background_colour ~ '^#[0-9A-Fa-f]{6}$'),
  constraint brand_kits_surface_colour_hex check (surface_colour ~ '^#[0-9A-Fa-f]{6}$'),
  constraint brand_kits_text_colour_hex check (text_colour ~ '^#[0-9A-Fa-f]{6}$'),
  constraint brand_kits_muted_text_colour_hex check (muted_text_colour ~ '^#[0-9A-Fa-f]{6}$')
);

create index if not exists brand_kits_organisation_id_idx
  on public.brand_kits (organisation_id);

create trigger brand_kits_set_updated_at
before update on public.brand_kits
for each row execute function public.set_updated_at();

-- FK from organisations → brand_kits (added after both tables exist)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organisations_default_brand_kit_id_fkey'
  ) then
    alter table public.organisations
      add constraint organisations_default_brand_kit_id_fkey
      foreign key (default_brand_kit_id)
      references public.brand_kits (id)
      on delete set null;
  end if;
end $$;

alter table public.brand_kits enable row level security;

create policy "brand_kits_select_member_or_platform"
on public.brand_kits
for select
to authenticated
using (
  public.is_platform_admin()
  or public.is_org_member(organisation_id)
);

create policy "brand_kits_insert_admin_or_platform"
on public.brand_kits
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(
    organisation_id,
    array['organisation_admin']::public.membership_role[]
  )
);

create policy "brand_kits_update_admin_or_platform"
on public.brand_kits
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

create policy "brand_kits_delete_admin_or_platform"
on public.brand_kits
for delete
to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(
    organisation_id,
    array['organisation_admin']::public.membership_role[]
  )
);

-- Storage bucket for organisation logos / brand assets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organisation-assets',
  'organisation-assets',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {organisation_id}/logos/{filename}
create policy "organisation_assets_public_read"
on storage.objects
for select
to public
using (bucket_id = 'organisation-assets');

create policy "organisation_assets_insert_admin"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'organisation-assets'
  and (
    public.is_platform_admin()
    or public.has_org_role(
      (storage.foldername(name))[1]::uuid,
      array['organisation_admin']::public.membership_role[]
    )
  )
);

create policy "organisation_assets_update_admin"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'organisation-assets'
  and (
    public.is_platform_admin()
    or public.has_org_role(
      (storage.foldername(name))[1]::uuid,
      array['organisation_admin']::public.membership_role[]
    )
  )
)
with check (
  bucket_id = 'organisation-assets'
  and (
    public.is_platform_admin()
    or public.has_org_role(
      (storage.foldername(name))[1]::uuid,
      array['organisation_admin']::public.membership_role[]
    )
  )
);

create policy "organisation_assets_delete_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'organisation-assets'
  and (
    public.is_platform_admin()
    or public.has_org_role(
      (storage.foldername(name))[1]::uuid,
      array['organisation_admin']::public.membership_role[]
    )
  )
);
