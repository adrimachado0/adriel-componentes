import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons";
import { CardCartControl } from "@/components/cart/card-cart-control";
import { ProductPhoto } from "@/components/product/product-photo";
import { StockBadge } from "@/components/product/stock-badge";
import type { StoreProduct } from "@/lib/data/products";
import { formatBrandAvailability, formatPrice } from "@/lib/format";
import { contact } from "@/lib/site";
import { productMessage, whatsappUrl } from "@/lib/whatsapp";

const MAX_DOTS = 5;

type ProductCardProps = {
  product: StoreProduct;
  /** Preload the cover (first cards above the fold). */
  preload?: boolean;
};

export function ProductCard({ product, preload = false }: ProductCardProps) {
  const href = `/producto/${product.id}`;
  const photoCount = product.images.length;
  const askUrl = whatsappUrl(contact.whatsappNumber, productMessage(product));
  // Every part is a single unit: stock 0 means it was sold (see "Ya vendidos").
  const sold = product.stock < 1;

  return (
    <article className="flex w-full flex-col gap-2 rounded-card-sm border border-line bg-surface p-1.5 shadow-card transition-[translate,box-shadow] duration-200 ease-out hover:-translate-y-[3px] hover:shadow-card-hover motion-reduce:hover:translate-y-0 sm:gap-3 sm:rounded-card sm:p-2.5">
      <div className="relative aspect-square overflow-hidden rounded-photo-sm bg-photo sm:aspect-[4/3] sm:rounded-photo">
        <div
          className={
            sold ? "absolute inset-0 opacity-60 grayscale" : "contents"
          }
        >
          <ProductPhoto
            path={product.images[0]}
            alt={product.title}
            sizes="(min-width: 1200px) 280px, (min-width: 640px) 34vw, 50vw"
            placeholderClassName="size-[52px] sm:size-[72px]"
            preload={preload}
          />
        </div>
        {/* Whole photo opens the detail; the title link is the accessible one. */}
        <Link
          prefetch
          href={href}
          tabIndex={-1}
          aria-hidden
          className="absolute inset-0"
        />

        <StockBadge
          stock={product.stock}
          className="top-2 left-2 sm:top-3 sm:left-3"
        />

        {sold ? null : (
          <a
            href={askUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Preguntar por WhatsApp: ${product.title}`}
            title="Preguntar por WhatsApp"
            className="group/ask absolute top-0 right-0 flex size-11 items-start justify-end rounded-full sm:top-2 sm:right-2 sm:items-center sm:justify-center"
          >
            <span className="mt-1.5 mr-1.5 flex size-8 items-center justify-center rounded-full bg-surface text-whatsapp shadow-float sm:m-0 sm:size-11">
              <WhatsAppIcon className="size-[18px] sm:size-5" />
            </span>
          </a>
        )}

        {photoCount > 1 ? (
          <div
            role="img"
            aria-label={`${photoCount} fotos`}
            className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-1 sm:bottom-3 sm:gap-[5px]"
          >
            {Array.from({ length: Math.min(photoCount, MAX_DOTS) }, (_, i) => (
              <span
                key={i}
                className={
                  i === 0
                    ? "h-[5px] w-3.5 rounded-full bg-primary sm:h-1.5 sm:w-[18px]"
                    : "size-[5px] rounded-full bg-primary-soft sm:size-1.5"
                }
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-1 pb-1 sm:gap-1.5 sm:px-1.5 sm:pt-0.5 sm:pb-1.5">
        <h3 className="line-clamp-2 text-sm leading-[1.3] font-bold sm:text-[15px] sm:leading-[1.35]">
          <Link prefetch href={href} className="text-ink hover:underline">
            {product.title}
          </Link>
        </h3>
        {product.brand ? (
          <p className="text-xs font-semibold text-muted sm:hidden">
            {product.brand}
          </p>
        ) : null}
        <p className="hidden text-[13px] font-semibold text-muted sm:block">
          {sold
            ? product.brand || "Vendido"
            : formatBrandAvailability(product.brand, product.stock)}
        </p>
        {product.description ? (
          <p className="hidden text-[13px] leading-normal text-muted sm:line-clamp-2">
            {product.description}
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-1.5 pt-1 sm:gap-3 sm:pt-1.5">
          <span
            className={`text-[17px] font-extrabold tracking-[-0.02em] tabular-nums sm:text-[21px] ${sold ? "text-muted" : ""}`}
          >
            {formatPrice(product.price)}
          </span>
          {sold ? null : (
            <CardCartControl productId={product.id} stock={product.stock} />
          )}
        </div>
      </div>
    </article>
  );
}
