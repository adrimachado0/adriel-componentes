"use client";

import { ShoppingCart } from "lucide-react";
import { StockBadge } from "@/components/product/stock-badge";
import { ImagePlaceholderIcon, WhatsAppIcon } from "@/components/icons";
import { formatBrandAvailability, formatPrice } from "@/lib/format";

/** Live "Así se ve en la tienda" card (desktop only). Mirrors ProductCard. */
export function PreviewCard({
  title,
  brand,
  description,
  price,
  stock,
  photos,
}: {
  title: string;
  brand: string;
  description: string;
  price: number;
  stock: number;
  photos: string[];
}) {
  const cover = photos[0];
  return (
    <aside
      aria-label="Vista previa"
      className="hidden max-w-[400px] flex-[1_1_320px] flex-col gap-3 lg:sticky lg:top-24 lg:flex"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-bold tracking-[0.08em] text-muted uppercase">
          Vista previa
        </span>
        <span className="text-[13px] text-muted">Así se ve en la tienda</span>
      </div>
      <div
        aria-hidden
        className="flex flex-col gap-3 rounded-card border border-line bg-surface p-2.5 shadow-card-hover"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-photo bg-photo">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="size-full object-contain" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-primary">
              <ImagePlaceholderIcon className="size-[72px]" />
            </span>
          )}
          <StockBadge stock={stock} className="top-3 left-3" />
          <span className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-surface text-whatsapp shadow-float">
            <WhatsAppIcon className="size-5" />
          </span>
          {photos.length > 1 ? (
            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-[5px]">
              {photos.slice(0, 5).map((p, i) => (
                <span
                  key={p}
                  className={
                    i === 0
                      ? "h-1.5 w-[18px] rounded-full bg-primary"
                      : "size-1.5 rounded-full bg-primary-soft"
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5 px-1.5 pt-0.5 pb-1.5">
          <span
            className={`line-clamp-2 text-[15px] leading-[1.35] font-bold ${title ? "text-ink" : "text-placeholder"}`}
          >
            {title || "Título del componente"}
          </span>
          <span className="text-[13px] font-semibold text-muted">
            {formatBrandAvailability(brand || "Marca", Math.max(stock, 0))}
          </span>
          <span className="line-clamp-2 text-[13px] leading-normal text-muted">
            {description || "La descripción aparece acá."}
          </span>
          <span className="pt-1.5 text-[21px] font-extrabold tracking-[-0.02em] tabular-nums">
            {formatPrice(Number.isFinite(price) ? price : 0)}
          </span>
          <span className="mt-1.5 flex h-11 items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-white">
            <ShoppingCart className="size-[18px]" strokeWidth={2} />
            Agregar al carrito
          </span>
        </div>
      </div>
    </aside>
  );
}
