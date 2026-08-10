-- Milestone B: AGG Drive preset + multi-marque assignments
-- brands = vehicle marques (and optional corporate brand)
-- location_brands / employee_brands = many-to-many marque links
-- locations.brand_id remains as primary/corporate brand FK (not dropped)

-- Allow experience_preset = 'drive'
alter table public.brand_kits
  drop constraint if exists brand_kits_experience_preset_check;

alter table public.brand_kits
  add constraint brand_kits_experience_preset_check
  check (
    experience_preset is null
    or experience_preset in (
      'dimension',
      'drive',
      'precision',
      'studio',
      'glass',
      'minimal-motion'
    )
  );

comment on column public.brand_kits.experience_preset is
  'Interactive card experience preset id (dimension, drive, …). Null = legacy layout renderer.';

-- Marque assignments for dealerships (locations)
create table if not exists public.location_brands (
  location_id uuid not null references public.locations (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (location_id, brand_id)
);

create index if not exists location_brands_brand_id_idx
  on public.location_brands (brand_id);

-- Marque assignments for employees
create table if not exists public.employee_brands (
  employee_id uuid not null references public.employees (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (employee_id, brand_id)
);

create index if not exists employee_brands_brand_id_idx
  on public.employee_brands (brand_id);

alter table public.location_brands enable row level security;
alter table public.employee_brands enable row level security;

-- Member read within organisation; org admins manage
create policy location_brands_select_member on public.location_brands
  for select to authenticated
  using (
    exists (
      select 1
      from public.locations l
      join public.memberships m on m.organisation_id = l.organisation_id
      where l.id = location_brands.location_id
        and m.user_id = auth.uid()
    )
  );

create policy location_brands_write_admin on public.location_brands
  for all to authenticated
  using (
    exists (
      select 1
      from public.locations l
      join public.memberships m on m.organisation_id = l.organisation_id
      where l.id = location_brands.location_id
        and m.user_id = auth.uid()
        and m.role in ('organisation_admin', 'brand_admin', 'location_admin')
    )
  )
  with check (
    exists (
      select 1
      from public.locations l
      join public.memberships m on m.organisation_id = l.organisation_id
      where l.id = location_brands.location_id
        and m.user_id = auth.uid()
        and m.role in ('organisation_admin', 'brand_admin', 'location_admin')
    )
  );

create policy employee_brands_select_member on public.employee_brands
  for select to authenticated
  using (
    exists (
      select 1
      from public.employees e
      join public.memberships m on m.organisation_id = e.organisation_id
      where e.id = employee_brands.employee_id
        and m.user_id = auth.uid()
    )
  );

create policy employee_brands_write_admin on public.employee_brands
  for all to authenticated
  using (
    exists (
      select 1
      from public.employees e
      join public.memberships m on m.organisation_id = e.organisation_id
      where e.id = employee_brands.employee_id
        and m.user_id = auth.uid()
        and m.role in ('organisation_admin', 'brand_admin', 'location_admin')
    )
  )
  with check (
    exists (
      select 1
      from public.employees e
      join public.memberships m on m.organisation_id = e.organisation_id
      where e.id = employee_brands.employee_id
        and m.user_id = auth.uid()
        and m.role in ('organisation_admin', 'brand_admin', 'location_admin')
    )
  );

-- Public assembler: include marques from employee_brands, else location_brands,
-- always including primary employee.brand when present.
create or replace function public.get_public_card(
  org_slug text,
  card_slug text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'card', jsonb_build_object(
      'id', c.id,
      'slug', c.slug,
      'layout_id', c.layout_id,
      'page_title', c.page_title,
      'meta_description', c.meta_description,
      'primary_cta_label', c.primary_cta_label,
      'primary_cta_url', c.primary_cta_url,
      'public_status', c.public_status
    ),
    'organisation', jsonb_build_object(
      'id', o.id,
      'name', o.name,
      'slug', o.slug,
      'website', o.website,
      'white_label_enabled', o.white_label_enabled
    ),
    'employee', jsonb_build_object(
      'id', e.id,
      'first_name', e.first_name,
      'last_name', e.last_name,
      'display_name', e.display_name,
      'job_title', e.job_title,
      'department', e.department,
      'email', e.email,
      'mobile', e.mobile,
      'whatsapp', e.whatsapp,
      'linkedin_url', e.linkedin_url,
      'profile_photo_url', e.profile_photo_url,
      'bio', e.bio
    ),
    'brand', case when b.id is null then null else jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'slug', b.slug,
      'website', b.website,
      'logo_url', b.logo_url
    ) end,
    'location', case when l.id is null then null else jsonb_build_object(
      'id', l.id,
      'name', l.name,
      'slug', l.slug,
      'type', l.type,
      'address', l.address,
      'phone', l.phone,
      'email', l.email,
      'website', l.website
    ) end,
    'marques', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', ranked.id,
          'name', ranked.name,
          'slug', ranked.slug,
          'website', ranked.website,
          'logo_url', ranked.logo_url
        )
        order by ranked.sort_order asc, ranked.name asc
      )
      from (
        select distinct on (src.id)
          src.id,
          src.name,
          src.slug,
          src.website,
          src.logo_url,
          src.sort_order
        from (
          select br.id, br.name, br.slug, br.website, br.logo_url, eb.sort_order
          from public.employee_brands eb
          join public.brands br on br.id = eb.brand_id
          where eb.employee_id = e.id
          union all
          select br.id, br.name, br.slug, br.website, br.logo_url, lb.sort_order
          from public.location_brands lb
          join public.brands br on br.id = lb.brand_id
          where lb.location_id = e.location_id
            and not exists (
              select 1 from public.employee_brands x where x.employee_id = e.id
            )
          union all
          select br.id, br.name, br.slug, br.website, br.logo_url, -1 as sort_order
          from public.brands br
          where br.id = e.brand_id
        ) src
        order by src.id, src.sort_order asc
      ) ranked
    ), '[]'::jsonb),
    'organisation_kit', case when ok.id is null then null else to_jsonb(ok) end,
    'brand_kit', case when bk.id is null then null else to_jsonb(bk) end,
    'card_kit', case when ck.id is null then null else to_jsonb(ck) end,
    'sections', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'type', s.type,
          'sort_order', s.sort_order,
          'enabled', s.enabled,
          'config_json', s.config_json
        )
        order by s.sort_order asc
      )
      from public.card_sections s
      where s.card_id = c.id and s.enabled = true
    ), '[]'::jsonb)
  )
  into result
  from public.cards c
  join public.organisations o on o.id = c.organisation_id
  join public.employees e on e.id = c.employee_id
  left join public.brands b on b.id = e.brand_id
  left join public.locations l on l.id = e.location_id
  left join public.brand_kits ok on ok.id = o.default_brand_kit_id
  left join public.brand_kits bk on bk.id = coalesce(b.brand_kit_id, (
    select bk2.id from public.brand_kits bk2
    where bk2.brand_id = b.id
    order by bk2.created_at asc
    limit 1
  ))
  left join public.brand_kits ck on ck.id = c.brand_kit_id
  where o.slug = org_slug
    and c.slug = card_slug
    and c.public_status = 'active'
    and o.status = 'active'
    and e.status = 'active'
    and (c.expires_at is null or c.expires_at > now());

  return result;
end;
$$;

revoke all on function public.get_public_card(text, text) from public;
grant execute on function public.get_public_card(text, text) to anon, authenticated;
