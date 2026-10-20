-- KMOS catalog schema for Supabase Postgres.
-- This migration is schema-only. It intentionally creates no catalog records.

create extension if not exists pgcrypto;
create schema if not exists private;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (length(trim(name)) > 0),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_name_not_blank check (length(trim(name)) > 0),
  constraint brands_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price numeric(12,2) not null,
  description text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  brand_id uuid not null references public.brands(id) on delete restrict,
  sort_order integer not null default 0,
  placement text not null,
  sale_tag text,
  limited_tag text,
  orders_until date,
  status text not null default 'draft',
  colorway_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint products_name_not_blank check (length(trim(name)) > 0),
  constraint products_price_nonnegative check (price >= 0),
  constraint products_sort_order_positive check (sort_order >= 0),
  constraint products_placement_valid check (placement in ('limited', 'popular', 'sale')),
  constraint products_status_valid check (status in ('draft', 'active', 'hidden')),
  constraint products_sale_fields check (sale_tag is null or placement = 'sale'),
  constraint products_limited_fields check ((limited_tag is null and orders_until is null) or placement = 'limited')
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  object_key text not null,
  public_url text not null,
  role text not null default 'gallery',
  sort_order integer not null default 0,
  alt_text text,
  created_at timestamptz not null default now(),
  constraint product_images_key_not_blank check (length(trim(object_key)) > 0),
  constraint product_images_role_valid check (role in ('main', 'secondary', 'gallery')),
  constraint product_images_sort_order_valid check (sort_order between 0 and 4),
  unique(product_id, object_key)
);

create unique index product_images_one_main_idx on public.product_images(product_id) where role = 'main';
create unique index product_images_one_secondary_idx on public.product_images(product_id) where role = 'secondary';

create table public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_sizes_name_not_blank check (length(trim(name)) > 0),
  unique(product_id, name)
);

create table public.colorways (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  color_hex text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint colorways_name_not_blank check (length(trim(name)) > 0),
  constraint colorways_hex_format check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  unique(product_id, name)
);

create table public.colorway_images (
  id uuid primary key default gen_random_uuid(),
  colorway_id uuid not null references public.colorways(id) on delete cascade,
  object_key text not null,
  public_url text not null,
  sort_order integer not null default 0,
  alt_text text,
  created_at timestamptz not null default now(),
  constraint colorway_images_key_not_blank check (length(trim(object_key)) > 0),
  constraint colorway_images_sort_order_valid check (sort_order between 0 and 2),
  unique(colorway_id, object_key)
);

create index products_category_id_idx on public.products(category_id);
create index products_brand_id_idx on public.products(brand_id);
create index products_storefront_idx on public.products(status, placement, sort_order);
create index product_images_product_id_idx on public.product_images(product_id);
create index product_sizes_product_id_idx on public.product_sizes(product_id);
create index colorways_product_id_idx on public.colorways(product_id);
create index colorway_images_colorway_id_idx on public.colorway_images(colorway_id);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at before update on public.categories for each row execute function private.set_updated_at();
create trigger brands_set_updated_at before update on public.brands for each row execute function private.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function private.set_updated_at();
create trigger colorways_set_updated_at before update on public.colorways for each row execute function private.set_updated_at();

create or replace function private.enforce_image_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare existing_count integer;
begin
  if tg_table_name = 'product_images' then
    select count(*) into existing_count from public.product_images where product_id = new.product_id and id <> new.id;
    if existing_count >= 5 then raise exception 'A product can have at most 5 images'; end if;
  else
    select count(*) into existing_count from public.colorway_images where colorway_id = new.colorway_id and id <> new.id;
    if existing_count >= 3 then raise exception 'A colorway can have at most 3 images'; end if;
  end if;
  return new;
end;
$$;

create trigger product_images_limit before insert or update on public.product_images for each row execute function private.enforce_image_limit();
create trigger colorway_images_limit before insert or update on public.colorway_images for each row execute function private.enforce_image_limit();

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_sizes enable row level security;
alter table public.colorways enable row level security;
alter table public.colorway_images enable row level security;

revoke all on public.admin_users from anon, authenticated;
revoke all on public.categories, public.brands, public.products, public.product_images, public.product_sizes, public.colorways, public.colorway_images from anon, authenticated;
grant select on public.categories, public.brands, public.products, public.product_images, public.product_sizes, public.colorways, public.colorway_images to anon;
grant select, insert, update, delete on public.categories, public.brands, public.products, public.product_images, public.product_sizes, public.colorways, public.colorway_images to authenticated;

create policy categories_public_read on public.categories for select to anon using (active);
create policy categories_member_read on public.categories for select to authenticated using (active or (select private.is_admin()));
create policy brands_public_read on public.brands for select to anon using (active);
create policy brands_member_read on public.brands for select to authenticated using (active or (select private.is_admin()));
create policy products_public_read on public.products for select to anon using (status = 'active');
create policy products_member_read on public.products for select to authenticated using (status = 'active' or (select private.is_admin()));

create policy product_images_public_read on public.product_images for select to anon using (exists (select 1 from public.products where products.id = product_id and products.status = 'active'));
create policy product_images_member_read on public.product_images for select to authenticated using ((select private.is_admin()) or exists (select 1 from public.products where products.id = product_id and products.status = 'active'));
create policy product_sizes_public_read on public.product_sizes for select to anon using (exists (select 1 from public.products where products.id = product_id and products.status = 'active'));
create policy product_sizes_member_read on public.product_sizes for select to authenticated using ((select private.is_admin()) or exists (select 1 from public.products where products.id = product_id and products.status = 'active'));
create policy colorways_public_read on public.colorways for select to anon using (exists (select 1 from public.products where products.id = product_id and products.status = 'active'));
create policy colorways_member_read on public.colorways for select to authenticated using ((select private.is_admin()) or exists (select 1 from public.products where products.id = product_id and products.status = 'active'));
create policy colorway_images_public_read on public.colorway_images for select to anon using (exists (select 1 from public.colorways join public.products on products.id = colorways.product_id where colorways.id = colorway_id and products.status = 'active'));
create policy colorway_images_member_read on public.colorway_images for select to authenticated using ((select private.is_admin()) or exists (select 1 from public.colorways join public.products on products.id = colorways.product_id where colorways.id = colorway_id and products.status = 'active'));

do $$
declare target_table text;
begin
  foreach target_table in array array['categories','brands','products','product_images','product_sizes','colorways','colorway_images'] loop
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_admin()))', target_table || '_admin_insert', target_table);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', target_table || '_admin_update', target_table);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_admin()))', target_table || '_admin_delete', target_table);
  end loop;
end;
$$;

comment on table public.product_images is 'R2 object metadata. Binary image data remains in Cloudflare R2.';
comment on column public.product_images.object_key is 'Stable R2 object key, for example products/<product-id>/<uuid>.webp.';
comment on column public.colorway_images.object_key is 'Stable R2 object key, for example colorways/<colorway-id>/<uuid>.webp.';
