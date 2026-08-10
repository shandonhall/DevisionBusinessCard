-- Mirror of RLS intent for documentation / review.
-- Canonical policies live in migrations/20260310140000_organisations_memberships.sql

-- profiles: select own or platform admin; update own
-- organisations: select member/platform; insert authenticated; update org admin/platform
-- memberships: select own/org/platform; insert admin or first-admin bootstrap; update/delete admin/platform
