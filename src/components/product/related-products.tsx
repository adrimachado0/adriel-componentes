import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductPhoto } from "@/components/product/product-photo";
import { Reveal } from "@/components/reveal";
import type { StoreProduct } from "@/lib/data/products";
import { formatPrice, formatStockLabel } from "@/lib/format";

/** "También te puede interesar": grid on desktop, horizontal scroller on mobile. */
export function RelatedProducts({ products }: { products: StoreProduct[] }) {
  if (products.length === 0) return null;
  return (
    <Reveal>
      <section
        aria-labelledby="related-title"
        className="flex flex-col gap-3.5 pt-9 sm:gap-5 sm:pt-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 sm:items-end">
          <h2
            id="related-title"
            className="text-xl font-extrabold tracking-[-0.02em] sm:text-2xl"
          >
            También te puede interesar
          </h2>
          <Link
            href="/#componentes"
            className="hidden min-h-11 items-center gap-1.5 text-sm font-bold text-primary hover:underline sm:flex"
          >
            Ver todos
            <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />
          </Link>
        </div>
        <ul className="-mx-4 scrollbar-none flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0">
          {products.map((product) => (
            <li key={product.id} className="flex w-[200px] shrink-0 sm:w-auto">
              <RelatedCard product={product} />
            </li>
          ))}
        </ul>
      </section>
    </Reveal>
  );
}

function RelatedCard({ product }: { product: StoreProduct }) {
  return (
    <Link
      href={`/producto/${product.id}`}
      className="flex w-full flex-col gap-2 rounded-card-sm border border-line bg-surface p-1.5 text-ink shadow-card transition-[translate,box-shadow] duration-200 ease-out hover:-translate-y-[3px] hover:shadow-card-hover motion-reduce:hover:translate-y-0 sm:gap-3 sm:rounded-card sm:p-2.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-photo-sm bg-photo sm:rounded-photo">
        <ProductPhoto
          path={product.images[0]}
          alt=""
          sizes="(min-width: 640px) 280px, 200px"
          placeholderClassName="size-[52px] sm:size-[72px]"
        />
      </div>
      <div className="flex flex-col gap-1 px-1 pb-1.5 sm:gap-1.5 sm:px-1.5 sm:pt-0.5 sm:pb-2">
        <span className="line-clamp-2 text-sm leading-[1.3] font-bold sm:text-[15px] sm:leading-[1.35]">
          {product.title}
        </span>
        <span className="text-xs font-semibold text-muted sm:hidden">
          {product.brand}
        </span>
        <span className="hidden text-[13px] font-semibold text-muted sm:block">
          {product.brand ? `${product.brand} · ` : ""}
          {formatStockLabel(product.stock)}
        </span>
        <span className="pt-0.5 text-[17px] font-extrabold tracking-[-0.02em] tabular-nums sm:mt-1 sm:pt-0 sm:text-[19px]">
          {formatPrice(product.price)}
        </span>
      </div>
    </Link>
  );
}
