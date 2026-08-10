-- Demo seed for Milestone 1 (run after migration in a non-production project).
-- Replace UUIDs with real auth.users IDs created via Supabase Auth before inserting memberships.
--
-- Example flow:
-- 1. Create users in Supabase Auth (Dashboard or API).
-- 2. Profiles auto-create via handle_new_user trigger.
-- 3. Optionally mark one profile as platform admin.
-- 4. Insert organisations + memberships below.

-- update public.profiles
-- set is_platform_admin = true
-- where email = 'admin@example.com';

insert into public.organisations (id, name, slug, legal_name, website, status, white_label_enabled)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'DeVision Media',
    'devision-media',
    'DeVision Media (Pty) Ltd',
    'https://example.com',
    'active',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Demo Automotive Group',
    'demo-automotive',
    'Demo Automotive Group',
    'https://example.com',
    'active',
    false
  )
on conflict (id) do nothing;

-- insert into public.memberships (user_id, organisation_id, role)
-- values
--   ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'organisation_admin'),
--   ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'organisation_admin');
