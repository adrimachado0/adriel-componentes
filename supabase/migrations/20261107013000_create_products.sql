-- Products catalog + product-images Storage bucket.
--
-- Access model: anyone can read products; only authenticated users can write.
-- Sign-ups are disabled in Auth, so the only authenticated user is the admin.
-- Server Actions re-check the session as defense in depth.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 400),
  brand       text not null default '' check (char_length(brand) <= 40),
  price       integer not null check (price > 0),       -- ARS, no cents
  stock       integer not null default 1 check (stock >= 0),
  images      text[] not null default '{}' check (cardinality(images) <= 8), -- Storage paths; [0] = cover
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.products is 'Used PC parts for sale. stock = 0 hides the product from the public store.';
comment on column public.products.price is 'Price in ARS, integer pesos (no cents).';
comment on column public.products.images is 'Paths inside the product-images bucket. images[1] (Postgres is 1-based) is the cover.';

-- Home: in-stock products, newest first.
create index products_in_stock_created_at_idx
  on public.products (created_at desc)
  where stock > 0;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
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

-- Trigger-only function: nobody needs to call it directly.
revoke execute on function public.set_updated_at() from public, anon, authenticated;

create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Data API exposure + RLS
-- ---------------------------------------------------------------------------

-- New tables are not exposed to the Data API automatically: grant explicitly.
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

alter table public.products enable row level security;

create policy "Products are readable by everyone"
  on public.products for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert products"
  on public.products for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update products"
  on public.products for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete products"
  on public.products for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Storage: public bucket for product photos
-- ---------------------------------------------------------------------------

-- Public bucket: objects are served through the public URL without any
-- select policy, and with no select policy for anon nobody can list it.
-- Size/type limits are enforced by Storage itself (images are compressed to
-- WebP in the browser; JPEG/PNG kept as fallback).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MiB
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Uploads only under products/ (no upsert: every upload uses a new name).
create policy "Authenticated users can upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = 'products'
  );

-- Removing objects requires select + delete on storage.objects.
create policy "Authenticated users can read product image objects"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images');

create policy "Authenticated users can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');
