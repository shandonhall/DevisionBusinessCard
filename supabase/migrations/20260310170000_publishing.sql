-- Milestone 6: Publishing polish — slug redirects + paused public resolution

create table if not exists public.card_slug_redirects (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  from_slug text not null,
  to_slug text not null,
  created_at timestamptz not null default now(),
  constraint card_slug_redirects_from_format check (from_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint card_slug_redirects_to_format check (to_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint card_slug_redirects_org_from_unique unique (organisation_id, from_slug)
);

create index if not exists card_slug_redirects_org_idx
  on public.card_slug_redirects (organisation_id, from_slug);

alter table public.card_slug_redirects enable row level security;

create policy "card_slug_redirects_select_member_or_platform"
on public.card_slug_redirects for select to authenticated
using (
  public.is_platform_admin()
  or public.is_org_member(organisation_id)
);

create policy "card_slug_redirects_insert_admin_or_platform"
on public.card_slug_redirects for insert to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "card_slug_redirects_update_admin_or_platform"
on public.card_slug_redirects for update to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

create policy "card_slug_redirects_delete_admin_or_platform"
on public.card_slug_redirects for delete to authenticated
using (
  public.is_platform_admin()
  or public.has_org_role(organisation_id, array['organisation_admin']::public.membership_role[])
);

-- Resolve public card requests: active payload | paused notice | slug redirect | missing
create or replace function public.resolve_public_card(
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
  org_row public.organisations%rowtype;
  card_row public.cards%rowtype;
  redirect_to text;
  payload jsonb;
begin
  select * into org_row
  from public.organisations o
  where o.slug = org_slug
    and o.status = 'active';

  if org_row.id is null then
    return jsonb_build_object('type', 'missing');
  end if;

  select * into card_row
  from public.cards c
  where c.organisation_id = org_row.id
    and c.slug = card_slug;

  if card_row.id is null then
    select r.to_slug into redirect_to
    from public.card_slug_redirects r
    where r.organisation_id = org_row.id
      and r.from_slug = card_slug
    limit 1;

    if redirect_to is not null then
      return jsonb_build_object(
        'type', 'redirect',
        'organisation_slug', org_row.slug,
        'to_slug', redirect_to
      );
    end if;

    return jsonb_build_object('type', 'missing');
  end if;

  if card_row.public_status = 'paused' then
    return jsonb_build_object(
      'type', 'paused',
      'organisation', jsonb_build_object(
        'name', org_row.name,
        'slug', org_row.slug,
        'white_label_enabled', org_row.white_label_enabled
      ),
      'message', 'This card is temporarily unavailable.'
    );
  end if;

  if card_row.public_status = 'active'
     and (card_row.expires_at is null or card_row.expires_at > now()) then
    payload := public.get_public_card(org_slug, card_slug);
    if payload is null then
      return jsonb_build_object('type', 'missing');
    end if;
    return jsonb_build_object('type', 'active', 'payload', payload);
  end if;

  -- draft / archived are not public
  return jsonb_build_object('type', 'missing');
end;
$$;

revoke all on function public.resolve_public_card(text, text) from public;
grant execute on function public.resolve_public_card(text, text) to anon, authenticated;
