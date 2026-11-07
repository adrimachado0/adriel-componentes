-- Readable product URLs: /producto/<slug> (e.g. /producto/memoria-ram-fury-16-gb).
-- The admin chooses the slug in the form (prefilled from the title). Old links
-- with the id (/producto/<uuid>) keep working: src/proxy.ts redirects them.

-- ---------------------------------------------------------------------------
-- slugify: same rules as slugify() in src/lib/slug.ts
-- ---------------------------------------------------------------------------

create function private.slugify(value text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select trim(both '-' from left(
    trim(both '-' from regexp_replace(
      translate(lower(value), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'),
      '[^a-z0-9]+', '-', 'g'
    )),
    80
  ));
$$;

revoke execute on function private.slugify(text) from public, anon;
grant execute on function private.slugify(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Column
-- ---------------------------------------------------------------------------

alter table public.products add column slug text;

comment on column public.products.slug is
  'URL of the product page (/producto/<slug>). Unique; filled from the title when not given.';

-- ---------------------------------------------------------------------------
-- Fill a missing slug from the title, adding -2, -3… when it is taken.
-- Inserts that do not send a slug (e.g. an older deploy) still work.
-- ---------------------------------------------------------------------------

create function public.set_product_slug()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  base text;
  candidate text;
  n integer := 1;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;

  base := coalesce(nullif(private.slugify(new.title), ''), 'componente');
  candidate := base;
  while exists (
    select 1 from public.products
    where slug = candidate and id is distinct from new.id
  ) loop
    n := n + 1;
    candidate := trim(both '-' from left(base, 75)) || '-' || n;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

revoke execute on function public.set_product_slug() from public, anon, authenticated;

create trigger products_set_slug
  before insert or update of slug on public.products
  for each row
  execute function public.set_product_slug();

-- ---------------------------------------------------------------------------
-- Backfill existing products (one statement per row so each sees the
-- previous ones), without touching updated_at.
-- ---------------------------------------------------------------------------

alter table public.products disable trigger products_set_updated_at;

do $$
declare
  product_id uuid;
begin
  for product_id in
    select id from public.products order by sort_order
  loop
    update public.products set slug = null where id = product_id;
  end loop;
end;
$$;

alter table public.products enable trigger products_set_updated_at;

-- ---------------------------------------------------------------------------
-- Constraints
-- ---------------------------------------------------------------------------

alter table public.products
  alter column slug set not null,
  add constraint products_slug_key unique (slug),
  add constraint products_slug_check check (
    char_length(slug) <= 80
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    -- Never shaped like a UUID: /producto/<uuid> is an old link to redirect.
    and slug !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );
