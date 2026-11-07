-- Writes require an authenticated user whose app_metadata.role is 'admin'.
--
-- app_metadata (raw_app_meta_data) can only be changed server-side, unlike
-- user_metadata, so it is safe for authorization. Even if sign-ups or anonymous
-- sign-ins were ever enabled by mistake, new users would not be admins.
--
-- Granting the role is a data change (not part of this migration):
--   update auth.users
--   set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
--   where email = '<admin email>';
-- The claim reaches the JWT on the next sign-in / token refresh.

-- Not exposed through the Data API.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create function private.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

drop policy "Authenticated users can insert products" on public.products;
drop policy "Authenticated users can update products" on public.products;
drop policy "Authenticated users can delete products" on public.products;

create policy "Admin can insert products"
  on public.products for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admin can update products"
  on public.products for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admin can delete products"
  on public.products for delete
  to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- storage.objects (product-images)
-- ---------------------------------------------------------------------------

drop policy "Authenticated users can upload product images" on storage.objects;
drop policy "Authenticated users can read product image objects" on storage.objects;
drop policy "Authenticated users can delete product images" on storage.objects;

create policy "Admin can upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = 'products'
    and (select private.is_admin())
  );

-- Removing objects requires select + delete on storage.objects.
create policy "Admin can read product image objects"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));

create policy "Admin can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));
