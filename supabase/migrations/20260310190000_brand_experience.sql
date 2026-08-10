-- Brand DNA experience fields on brand_kits (white-label interactive card engine)

alter table public.brand_kits
  add column if not exists experience_preset text
    check (
      experience_preset is null
      or experience_preset in (
        'dimension',
        'precision',
        'studio',
        'glass',
        'minimal-motion'
      )
    );

alter table public.brand_kits
  add column if not exists experience_config jsonb;

comment on column public.brand_kits.experience_preset is
  'Interactive card experience preset id (e.g. dimension). Null = legacy layout renderer.';

comment on column public.brand_kits.experience_config is
  'Optional partial ExperienceConfig overrides (tilt, parallax, etc.).';
