-- Milestone 4: Cards + sections + public read path
-- Public recipients must open active cards without an account.

create type public.card_public_status as enum (
  'draft',
  'active',
  'paused',
  'archived'
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  slug text not null,
  public_status public.card_public_status not null default 'draft',
  layout_id text not null default 'corporate'
    check (layout_id in ('executive', 'corporate', 'modern')),
  brand_kit_id uuid references public.brand_kits (id) on delete set null,
  page_title text,
  meta_description text,
  primary_cta_label text,
  primary_cta_url text,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cards_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint cards_slug_length check (char_length(slug) between 2 and 60),
  constraint cards_org_slug_unique unique (organisation_id, slug),
  constraint cards_employee_unique unique (employee_id)
);

create index cards_organisation_id_idx on public.cards (organisation_id);
create index cards_public_status_idx on public.cards (organisation_id, public_status);
create index cards_slug_lookup_idx on public.cards (slug);

create trigger cards_set_updated_at
before update on public.cards
for each row execute function public.set_updated_at();

create table public.card_sections (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  type text not null
    check (type in (
      'hero',
      'contact_actions',
      'about',
      'social_links',
      'custom_links',
      'qr',
      'exchange_details'
    )),
  sort_order integer not null default 0,
  enabled boolean not null default true,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index card_sections_card_id_idx on public.card_sections (card_id, sort_order);

create trigger card_sections_set_updated_at
before update on public.card_sections
for each row execute function public.set_updated_at();

alter table public.cards enable row level security;
alter table public.card_sections enable row level security;

-- Authenticated member access
create policy "cards_select_member_or_platform"
on public.cards for select to authenticated
using (
  public.is_platform_admin()
  or public.is_org_member(organisation_id)
);

create policy "cards_insert_admin_or_platform"
on public.cards for insert to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "cards_update_admin_or_platform"
on public.cards for update to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "cards_delete_admin_or_platform"
on public.cards for delete to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "card_sections_select_member_or_platform"
on public.card_sections for select to authenticated
using (
  exists (
    select 1 from public.cards c
    where c.id = card_id
      and (
        public.is_platform_admin()
        or public.is_org_member(c.organisation_id)
      )
  )
);

create policy "card_sections_insert_admin_or_platform"
on public.card_sections for insert to authenticated
with check (
  exists (
    select 1 from public.cards c
    where c.id = card_id
      and (
        public.is_platform_admin()
        or public.has_org_role(c.organisation_id, array['organisation_admin']::public.membership_role[])
      )
  )
);

create policy "card_sections_update_admin_or_platform"
on public.card_sections for update to authenticated
using (
  exists (
    select 1 from public.cards c
    where c.id = card_id
      and (
        public.is_platform_admin()
        or public.has_org_role(c.organisation_id, array['organisation_admin']::public.membership_role[])
      )
  )
)
with check (
  exists (
    select 1 from public.cards c
    where c.id = card_id
      and (
        public.is_platform_admin()
        or public.has_org_role(c.organisation_id, array['organisation_admin']::public.membership_role[])
      )
  )
);

create policy "card_sections_delete_admin_or_platform"
on public.card_sections for delete to authenticated
using (
  exists (
    select 1 from public.cards c
    where c.id = card_id
      and (
        public.is_platform_admin()
        or public.has_org_role(c.organisation_id, array['organisation_admin']::public.membership_role[])
      )
  )
);

-- Public card payload: only active, non-expired cards.
-- SECURITY DEFINER avoids granting broad anon SELECT on private employee tables.
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
