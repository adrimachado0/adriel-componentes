-- Product descriptions can be up to 1000 characters (was 400).
-- Widening the limit never invalidates existing rows.
alter table public.products
  drop constraint products_description_check;

alter table public.products
  add constraint products_description_check
  check (char_length(description) <= 1000);
