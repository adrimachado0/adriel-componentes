import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ChartColumn, SquareArrowOutUpRight } from "lucide-react";
import { ShareLinkForm } from "@/components/admin/share-links/share-link-form";
import { ShareLinkList } from "@/components/admin/share-links/share-link-list";
import { UMAMI_DASHBOARD_URL } from "@/lib/analytics";
import { requireAdminPage } from "@/lib/auth";
import { getShareLinks } from "@/lib/data/share-links";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = { title: "Links para compartir" };

export default function ShareLinksPage() {
  return (
    <div className="container-page flex flex-1 flex-col gap-5 pt-2 pb-24 sm:pt-6">
      <div className="flex flex-col gap-1.5 sm:gap-2.5">
        <Link
          href="/admin"
          className="-ml-1.5 flex min-h-11 items-center gap-1.5 self-start px-1.5 text-sm font-semibold text-muted hover:text-ink sm:ml-0 sm:min-h-8 sm:px-0"
        >
          <ArrowLeft className="size-4" strokeWidth={2.2} aria-hidden />
          Mis componentes
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex max-w-[620px] flex-col gap-1.5">
            <h1 className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.025em] sm:text-[30px]">
              Links para compartir
            </h1>
            <p className="text-sm leading-normal text-muted sm:text-[15px]">
              Creá un link distinto para cada grupo o publicación. Todos llevan
              a la tienda, y en las estadísticas ves cuántas visitas trajo cada
              uno.
            </p>
          </div>
          <a
            href={UMAMI_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center gap-2 rounded-full border border-line-strong bg-surface pr-4 pl-3.5 text-sm font-bold whitespace-nowrap transition-colors hover:border-primary hover:text-primary"
          >
            <ChartColumn
              className="size-[18px]"
              strokeWidth={1.9}
              aria-hidden
            />
            Ver estadísticas
            <SquareArrowOutUpRight
              className="size-3.5 text-muted"
              strokeWidth={2}
              aria-hidden
            />
          </a>
        </div>
      </div>

      <Suspense fallback={<ShareLinksSkeleton />}>
        <ShareLinks />
      </Suspense>
    </div>
  );
}

async function ShareLinks() {
  const { supabase } = await requireAdminPage();
  const links = await getShareLinks(supabase);
  const siteUrl = getSiteUrl();
  return (
    <div className="flex flex-wrap items-start gap-5">
      <ShareLinkForm siteUrl={siteUrl} />
      <ShareLinkList links={links} siteUrl={siteUrl} />
    </div>
  );
}

function ShareLinksSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-wrap items-start gap-5">
      <span className="sr-only" role="status">
        Cargando links…
      </span>
      <span className="h-[360px] flex-[1_1_340px] skeleton rounded-card" />
      <span className="h-[280px] flex-[2_1_420px] skeleton rounded-card" />
    </div>
  );
}
