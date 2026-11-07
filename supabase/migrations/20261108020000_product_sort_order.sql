-- Manual catalog order, chosen by the admin (lowest sort_order first).
-- Sold products (stock = 0) stay visible in the store under "Ya vendidos".

alter table public.products
  add column sort_order integer not null default 0;

comment on column public.products.sort_order is
  'Manual order in the store and admin list (ascending). New products go first.';

-- The current order (newest first) becomes the initial manual order.
update public.products p
set sort_order = o.n
from (
  select id, row_number() over (order by created_at desc) as n
  from public.products
) o
where p.id = o.id;

-- Deferrable so a single UPDATE can swap positions (checked at statement end).
alter table public.products
  add constraint products_sort_order_key unique (sort_order)
  deferrable initially immediate;

-- The store no longer filters by stock nor orders by created_at.
drop index if exists public.products_in_stock_created_at_idx;

comment on table public.products is
  'Used PC parts for sale. stock = 0 means sold: shown under "Ya vendidos".';

-- ---------------------------------------------------------------------------
-- New products go to the top of the list
-- ---------------------------------------------------------------------------

create function public.set_product_sort_order()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.sort_order := coalesce((select min(sort_order) from public.products), 1) - 1;
  return new;
end;
$$;

revoke execute on function public.set_product_sort_order() from public, anon, authenticated;

create trigger products_set_sort_order
  before insert on public.products
  for each row
  execute function public.set_product_sort_order();

-- ---------------------------------------------------------------------------
-- Reorder: the given products take, in the given order, the slots they
-- already occupy. Others keep their place, so a filtered list can be
-- reordered on its own. Security invoker: RLS (admin only) applies.
-- ---------------------------------------------------------------------------

create function public.reorder_products(ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if cardinality(ids) <> (select count(distinct x) from unnest(ids) as x) then
    raise exception 'reorder_products: duplicate ids';
  end if;

  with wanted as (
    select t.id, row_number() over (order by t.ord) as n
    from unnest(ids) with ordinality as t(id, ord)
    where exists (select 1 from public.products p where p.id = t.id)
  ),
  slots as (
    select sort_order, row_number() over (order by sort_order) as n
    from public.products
    where id = any(ids)
  )
  update public.products p
  set sort_order = s.sort_order
  from wanted w
  join slots s on s.n = w.n
  where p.id = w.id
    and p.sort_order <> s.sort_order;
end;
$$;

revoke execute on function public.reorder_products(uuid[]) from public, anon;
grant execute on function public.reorder_products(uuid[]) to authenticated;
