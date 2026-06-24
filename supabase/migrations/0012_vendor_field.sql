-- Add preferred_vendor field to custom_products so teams can track
-- which distributor/supplier they buy each product from.
alter table public.custom_products
  add column if not exists vendor text not null default '';
