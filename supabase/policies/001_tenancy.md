-- Mirror of RLS intent for documentation / review.
-- Canonical policies live in migrations:
--   20260310140000_organisations_memberships.sql
--   20260311100000_tenant_isolation_hardening.sql

-- profiles:
--   select own or platform admin
--   update own (trigger blocks is_platform_admin / status unless service_role)

-- organisations:
--   select member/platform
--   insert platform admin ONLY
--   update org admin/platform
--   delete platform admin ONLY

-- memberships:
--   select own/org/platform
--   insert admin or first-admin bootstrap
--   update/delete admin/platform

-- employees:
--   member read; org-admin write
--   linked employee self-update allowed
--   trigger blocks self-change of organisation_id / user_id / status / brand_id / location_id
--   trigger enforces brand_id and location_id same-organisation

-- location_brands / employee_brands:
--   member/platform read
--   admin write with same-org brand check (+ platform admin)
--   trigger enforces brand and parent same organisation

-- cards:
--   trigger enforces employee same organisation

-- brand_kits:
--   trigger enforces brand_id same organisation when set

-- claim_employee_profile:
--   fails closed when multiple unlinked employees share the same email
