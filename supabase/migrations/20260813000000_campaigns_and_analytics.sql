-- First-party campaigns + card analytics.
-- Tenant isolation: members read their org only; public ingest is RPC-only.

create type public.campaign_placement as enum ('desktop_left', 'desktop_right');
create type public.campaign_status as enum ('draft', 'active', 'archived');
create type public.card_analytics_event_type as enum (
  'card_view',
  'qr_source_open',
  'card_engaged',
  'engagement_time',
  'card_flip',
  'save_contact',
  'call_click',
  'whatsapp_click',
  'email_click',
  'website_click',
  'share_click',
  'copy_link',
  'campaign_impression',
  'campaign_click'
);
create type public.card_analytics_source as enum (
  'qr',
  'direct',
  'shared',
  'campaign',
  'other'
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  brand_id uuid references public.brands (id) on delete set null,
  location_id uuid references public.locations (id) on delete set null,
  name text not null,
  title text not null,
  body text,
  image_url text,
  cta_label text,
  cta_url text,
  placement public.campaign_placement not null default 'desktop_right',
  status public.campaign_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_name_length check (char_length(name) between 1 and 120),
  constraint campaigns_title_length check (char_length(title) between 1 and 160)
);

create index campaigns_organisation_id_idx on public.campaigns (organisation_id);
create index campaigns_org_status_placement_idx
  on public.campaigns (organisation_id, status, placement);

create trigger campaigns_set_updated_at
before update on public.campaigns
for each row
execute function public.set_updated_at();

create table public.card_analytics_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  employee_id uuid references public.employees (id) on delete set null,
  brand_id uuid references public.brands (id) on delete set null,
  location_id uuid references public.locations (id) on delete set null,
  session_id uuid not null,
  event_type public.card_analytics_event_type not null,
  source public.card_analytics_source not null default 'direct',
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index card_analytics_events_org_time_idx
  on public.card_analytics_events (organisation_id, occurred_at desc);
create index card_analytics_events_card_time_idx
  on public.card_analytics_events (card_id, occurred_at desc);
create index card_analytics_events_org_type_time_idx
  on public.card_analytics_events (organisation_id, event_type, occurred_at desc);
create index card_analytics_events_org_session_idx
  on public.card_analytics_events (organisation_id, session_id);

alter table public.campaigns enable row level security;
alter table public.card_analytics_events enable row level security;

create policy "campaigns_select_member_or_platform"
on public.campaigns for select to authenticated
using (
  public.is_platform_admin()
  or public.is_org_member(organisation_id)
);

create policy "campaigns_insert_admin_or_platform"
on public.campaigns for insert to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "campaigns_update_admin_or_platform"
on public.campaigns for update to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "campaigns_delete_admin_or_platform"
on public.campaigns for delete to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "card_analytics_events_select_member_or_platform"
on public.card_analytics_events for select to authenticated
using (
  public.is_platform_admin()
  or public.is_org_member(organisation_id)
);

-- No direct INSERT/UPDATE/DELETE for clients. Ingest is SECURITY DEFINER only.

create or replace function public.enforce_campaign_same_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.brand_id is not null then
    if not exists (
      select 1 from public.brands b
      where b.id = new.brand_id and b.organisation_id = new.organisation_id
    ) then
      raise exception 'campaign brand must belong to the same organisation';
    end if;
  end if;
  if new.location_id is not null then
    if not exists (
      select 1 from public.locations l
      where l.id = new.location_id and l.organisation_id = new.organisation_id
    ) then
      raise exception 'campaign location must belong to the same organisation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists campaigns_enforce_same_org on public.campaigns;
create trigger campaigns_enforce_same_org
before insert or update on public.campaigns
for each row
execute function public.enforce_campaign_same_org();

revoke all on function public.enforce_campaign_same_org() from public;

create or replace function public.ingest_card_analytics_event(
  p_card_id uuid,
  p_session_id uuid,
  p_event_type public.card_analytics_event_type,
  p_source public.card_analytics_source default 'direct',
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  card_row public.cards%rowtype;
  emp_row public.employees%rowtype;
  recent_count int;
  meta jsonb;
  new_id uuid;
begin
  if p_card_id is null or p_session_id is null or p_event_type is null then
    raise exception 'invalid analytics payload';
  end if;

  select * into card_row
  from public.cards c
  where c.id = p_card_id
    and c.public_status = 'active'
  limit 1;

  if not found then
    raise exception 'card is not publicly active';
  end if;

  select count(*)::int into recent_count
  from public.card_analytics_events e
  where e.session_id = p_session_id
    and e.occurred_at > now() - interval '1 minute';

  if recent_count >= 60 then
    raise exception 'analytics rate limited';
  end if;

  meta := coalesce(p_metadata, '{}'::jsonb);
  if octet_length(meta::text) > 2048 then
    meta := jsonb_build_object('truncated', true);
  end if;

  select * into emp_row
  from public.employees e
  where e.id = card_row.employee_id
  limit 1;

  insert into public.card_analytics_events (
    organisation_id,
    card_id,
    employee_id,
    brand_id,
    location_id,
    session_id,
    event_type,
    source,
    metadata
  ) values (
    card_row.organisation_id,
    card_row.id,
    card_row.employee_id,
    emp_row.brand_id,
    emp_row.location_id,
    p_session_id,
    p_event_type,
    coalesce(p_source, 'direct'),
    meta
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.ingest_card_analytics_event(uuid, uuid, public.card_analytics_event_type, public.card_analytics_source, jsonb) from public;
grant execute on function public.ingest_card_analytics_event(uuid, uuid, public.card_analytics_event_type, public.card_analytics_source, jsonb) to anon, authenticated;

-- Public campaign read for active desktop slots (no draft/archived leak).
create or replace function public.get_public_campaigns_for_card(p_card_id uuid)
returns setof public.campaigns
language sql
stable
security definer
set search_path = public
as $$
  select c.*
  from public.campaigns c
  join public.cards card on card.organisation_id = c.organisation_id
  where card.id = p_card_id
    and card.public_status = 'active'
    and c.status = 'active'
    and (c.starts_at is null or c.starts_at <= now())
    and (c.ends_at is null or c.ends_at >= now());
$$;

revoke all on function public.get_public_campaigns_for_card(uuid) from public;
grant execute on function public.get_public_campaigns_for_card(uuid) to anon, authenticated;
