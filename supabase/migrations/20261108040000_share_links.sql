-- Short links to share the store: /de/<slug> redirects to
-- /?utm_source=<source>&utm_campaign=<slug>, so the analytics can tell which
-- group or post each visit came from.
--
-- Only the admin can list, create or delete them. Visitors resolve one link at
-- a time through share_link_source(), so the list of campaigns stays private.

create table public.share_links (
  slug       text primary key check (
    char_length(slug) <= 40
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  source     text not null check (source in ('whatsapp', 'facebook', 'instagram', 'otro')),
  created_at timestamptz not null default now()
);

comment on table public.share_links is
  'Share links (/de/<slug>). slug = utm_campaign, source = utm_source.';

grant select, insert, delete on table public.share_links to authenticated;

alter table public.share_links enable row level security;

create policy "Admin can read share links"
  on public.share_links for select
  to authenticated
  using ((select private.is_admin()));

create policy "Admin can create share links"
  on public.share_links for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admin can delete share links"
  on public.share_links for delete
  to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- Public lookup of a single link (used by the /de/<slug> redirect).
-- Security definer on purpose: it returns only the source of the exact slug
-- asked for, never the list.
-- ---------------------------------------------------------------------------

create function public.share_link_source(link_slug text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select source from public.share_links where slug = link_slug;
$$;

revoke execute on function public.share_link_source(text) from public;
grant execute on function public.share_link_source(text) to anon, authenticated;
