-- Optional image used when a product link is shared (Open Graph / WhatsApp).
-- Storage path in product-images, like `images`. NULL → the cover photo is used.
alter table public.products
  add column og_image text
  check (
    og_image is null
    or og_image ~ '^products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png)$'
  );

comment on column public.products.og_image is
  'Optional share image (Storage path). Rendered as a 1200x630 JPEG; falls back to images[1].';
