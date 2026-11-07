import Link from "next/link";
import { Suspense } from "react";
import { GripVertical, Plus, Search } from "lucide-react";
import { AdminListSkeleton } from "@/components/admin/admin-list-skeleton";
import { AdminProductList } from "@/components/admin/admin-product-list";
import { ChipIcon } from "@/components/icons";
import {
  filterAdminProducts,
  formatAdminSummary,
  parseStatusFilter,
  STATUS_FILTERS,
  type StatusFilter,
} from "@/lib/admin-products";
import { requireAdminPage } from "@/lib/auth";
import { getAdminProducts } from "@/lib/data/admin-products";

const STATUS_LABELS: Record<StatusFilter, string> = {
  todos: "Todos",
  "en-venta": "En venta",
  "sin-stock": "Vendidos",
};

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="container-page flex flex-1 flex-col gap-5 pt-6 pb-24 sm:pt-8">
      <Suspense fallback={<AdminListSkeleton />}>
        <AdminList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminList({
  searchParams,
}: Pick<PageProps<"/admin">, "searchParams">) {
  const [{ supabase }, params] = await Promise.all([
    requireAdminPage(),
    searchParams,
  ]);
  const products = await getAdminProducts(supabase);
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const status = parseStatusFilter(params.estado);
  const { visible, counts } = filterAdminProducts(products, { query, status });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.025em] sm:text-[30px]">
            Mis componentes
          </h1>
          <p className="text-sm text-muted sm:text-[15px]">
            {formatAdminSummary(products)}
          </p>
        </div>
        <NewProductLink />
      </div>

      {products.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form
            role="search"
            action="/admin"
            className="relative max-w-[420px] flex-[1_1_280px]"
          >
            <label htmlFor="admin-search" className="sr-only">
              Buscar componentes
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted"
              strokeWidth={2}
              aria-hidden
            />
            <input
              id="admin-search"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Buscar por título o marca"
              autoComplete="off"
              className="h-12 w-full appearance-none rounded-full border-[1.5px] border-line-strong bg-surface pr-4 pl-11 text-base outline-none focus:border-primary sm:text-sm"
            />
            {status !== "todos" ? (
              <input type="hidden" name="estado" value={status} />
            ) : null}
          </form>
          <StatusTabs query={query} status={status} counts={counts} />
        </div>
      ) : null}

      {visible.length > 1 ? (
        <p className="-mt-1.5 text-[13px] text-muted">
          Arrastrá{" "}
          <GripVertical className="inline size-4 align-[-3px]" aria-hidden />{" "}
          para elegir el orden en que se ven en la tienda.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        {products.length === 0 ? (
          <EmptyState />
        ) : visible.length === 0 ? (
          <NoResults />
        ) : (
          <AdminProductList products={visible} />
        )}
      </div>
    </>
  );
}

function StatusTabs({
  query,
  status,
  counts,
}: {
  query: string;
  status: StatusFilter;
  counts: Record<StatusFilter, number>;
}) {
  return (
    <nav
      aria-label="Filtrar por estado"
      className="flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-line-strong bg-surface p-[3px]"
    >
      {STATUS_FILTERS.map((value) => {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (value !== "todos") params.set("estado", value);
        const href = params.size > 0 ? `/admin?${params}` : "/admin";
        const active = value === status;
        return (
          <Link
            key={value}
            href={href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold whitespace-nowrap ${
              active ? "bg-ink text-white" : "text-ink hover:bg-page"
            }`}
          >
            {STATUS_LABELS[value]}
            <span
              className={`text-xs font-bold ${active ? "text-tab-count" : "text-muted"}`}
            >
              {counts[value]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function NewProductLink({ size = "lg" }: { size?: "lg" | "sm" }) {
  return (
    <Link
      href="/admin/nuevo"
      className={`flex items-center gap-2 rounded-full bg-primary font-bold text-white shadow-primary transition-colors hover:bg-primary-hover ${
        size === "lg"
          ? "h-12 pr-[22px] pl-[18px] text-[15px]"
          : "mt-1.5 h-[46px] px-[22px] text-sm"
      }`}
    >
      {size === "lg" ? (
        <Plus className="size-[18px]" strokeWidth={2.4} aria-hidden />
      ) : null}
      Nuevo componente
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary-tint text-primary">
        <ChipIcon className="size-7" />
      </span>
      <p className="text-[17px] font-extrabold">
        Todavía no cargaste componentes
      </p>
      <p className="max-w-[340px] text-sm leading-normal text-muted">
        Cargá el primero con sus fotos, precio y cantidad, y aparece en la
        tienda.
      </p>
      <NewProductLink size="sm" />
    </div>
  );
}

function NoResults() {
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 py-14 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary-tint text-primary">
        <Search className="size-7" strokeWidth={1.8} aria-hidden />
      </span>
      <p className="text-[17px] font-extrabold">No encontramos componentes</p>
      <p className="max-w-[340px] text-sm leading-normal text-muted">
        Probá con otra búsqueda o mirá todos los componentes.
      </p>
      <Link
        href="/admin"
        className="mt-1.5 flex h-[46px] items-center rounded-full border border-line-strong px-[22px] text-sm font-bold"
      >
        Ver todos
      </Link>
    </div>
  );
}
