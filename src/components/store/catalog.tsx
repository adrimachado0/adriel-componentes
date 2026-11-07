import Link from "next/link";
import type { ReactNode } from "react";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { TrackEvent } from "@/components/analytics";
import { Reveal } from "@/components/reveal";
import { BrandChips } from "@/components/store/brand-chips";
import { cacheLife, cacheTag } from "next/cache";
import {
  getBrands,
  getSoldProducts,
  getStoreProducts,
  PRODUCTS_TAG,
  type StoreProduct,
} from "@/lib/data/products";

/** Cards in the first row(s) get their cover preloaded. */
const PRELOAD_COUNT = 4;

export async function Catalog({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { marca } = await searchParams;
  return (
    <CachedCatalog
      requested={typeof marca === "string" ? marca.trim().slice(0, 60) : ""}
    />
  );
}

/**
 * The rendered grid is cached per brand filter (not only the data), so a
 * <Link prefetch> to "/" or "/?marca=X" can include it and the navigation is
 * instant. Saving a product invalidates the "products" tag.
 */
async function CachedCatalog({ requested }: { requested: string }) {
  "use cache";
  cacheLife("hours");
  cacheTag(PRODUCTS_TAG);

  const [products, soldProducts] = await Promise.all([
    getStoreProducts(),
    getSoldProducts(),
  ]);
  const brands = getBrands(products);
  const activeBrand = requested
    ? brands.find(
        (b) =>
          b.localeCompare(requested, "es-AR", { sensitivity: "base" }) === 0,
      )
    : undefined;
  const visible = requested
    ? products.filter((p) => p.brand === activeBrand)
    : products;
  const sold = requested
    ? soldProducts.filter((p) => p.brand === activeBrand)
    : soldProducts;

  return (
    <CatalogLayout
      count={visible.length}
      chips={<BrandChips brands={brands} activeBrand={activeBrand} />}
    >
      {visible.length > 0 ? (
        <Reveal>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] sm:gap-5">
            {visible.map((product, i) => (
              <li key={product.id} className="flex">
                <ProductCard product={product} preload={i < PRELOAD_COUNT} />
              </li>
            ))}
          </ul>
        </Reveal>
      ) : (
        <EmptyCatalog filtered={Boolean(requested)} />
      )}
      <SoldProducts products={sold} />
      {activeBrand ? (
        <TrackEvent event="filtrar-marca" data={{ marca: activeBrand }} />
      ) : null}
    </CatalogLayout>
  );
}

/** "Ya vendidos": sold parts stay visible below the catalog. */
function SoldProducts({ products }: { products: StoreProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section
      aria-labelledby="sold-title"
      className="flex flex-col gap-3.5 pt-10 sm:gap-5 sm:pt-14"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 sm:items-end">
        <h2
          id="sold-title"
          className="text-[21px] font-extrabold tracking-[-0.02em] sm:text-[26px]"
        >
          Ya vendidos
        </h2>
        <span className="shrink-0 text-[13px] font-medium text-muted sm:text-sm">
          {products.length === 1
            ? "1 componente"
            : `${products.length} componentes`}
        </span>
      </div>
      <Reveal>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] sm:gap-5">
          {products.map((product) => (
            <li key={product.id} className="flex">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

export function CatalogLayout({
  count,
  chips,
  children,
}: {
  count: number | null;
  chips: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <section
        id="componentes"
        aria-labelledby="catalog-title"
        className="container-page flex flex-col gap-3.5 pt-7 sm:gap-[18px] sm:pt-11"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 sm:items-end">
          <h2
            id="catalog-title"
            className="text-[21px] font-extrabold tracking-[-0.02em] sm:text-[26px]"
          >
            Todos los componentes
          </h2>
          {count === null ? (
            <span className="h-4 w-24 skeleton rounded-full" />
          ) : (
            <span className="shrink-0 text-[13px] font-medium text-muted sm:text-sm">
              {count === 1 ? "1 publicación" : `${count} publicaciones`}
            </span>
          )}
        </div>
        {chips}
      </section>
      <div className="container-page flex-1 pt-4 pb-10 sm:pt-5 sm:pb-[88px]">
        {children}
      </div>
    </>
  );
}

function EmptyCatalog({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-card border border-line bg-surface px-6 py-16 text-center shadow-card">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary-tint text-primary">
        <PackageSearch className="size-7" strokeWidth={1.8} aria-hidden />
      </span>
      <p className="text-[17px] font-extrabold">
        {filtered
          ? "No hay componentes de esa marca"
          : "Por ahora no hay componentes disponibles"}
      </p>
      <p className="max-w-[340px] text-sm leading-normal text-muted">
        {filtered
          ? "Probá con otra marca o mirá todo lo que tengo disponible."
          : "Estoy cargando nuevos componentes. Si buscás algo en particular, escribime por WhatsApp."}
      </p>
      {filtered ? (
        <Link
          prefetch
          href="/"
          scroll={false}
          className="mt-1.5 flex h-[46px] items-center rounded-full bg-primary px-[22px] text-sm font-bold text-white transition-colors hover:bg-primary-hover"
        >
          Ver todos
        </Link>
      ) : null}
    </div>
  );
}
