"use client";

import { useOptimistic, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Pencil, Plus } from "lucide-react";
import { ImagePlaceholderIcon } from "@/components/icons";
import { updateStock } from "@/lib/actions/products";
import { formatPhotoCount } from "@/lib/admin-products";
import type { AdminProduct } from "@/lib/data/admin-products";
import { formatPrice } from "@/lib/format";
import { productImageUrl } from "@/lib/site";
import { DeleteProductButton } from "./delete-product-dialog";
import { useToast } from "./toast-provider";

export function AdminProductRow({ product }: { product: AdminProduct }) {
  const [stock, setOptimisticStock] = useOptimistic(product.stock);
  const [, startTransition] = useTransition();
  const notify = useToast();
  const onSale = stock > 0;
  const cover = product.images[0];

  function changeStock(next: number) {
    if (next < 0) return;
    // Optimistic: the number (and the status pill) change right away; if the
    // action fails, React reverts to the server value when the transition ends.
    startTransition(async () => {
      setOptimisticStock(next);
      const result = await updateStock({ id: product.id, stock: next });
      if (!result.ok) notify(result.error, "error");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-3.5 px-4 py-3.5 sm:px-[18px]">
      <div className="flex min-w-0 flex-[1_1_320px] items-center gap-3.5">
        <span className="relative size-[68px] shrink-0 overflow-hidden rounded-photo bg-photo">
          {cover ? (
            <Image
              src={productImageUrl(cover)}
              alt=""
              fill
              sizes="68px"
              className="object-contain"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-primary">
              <ImagePlaceholderIcon className="size-[30px]" />
            </span>
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-[7px]">
          <span className="truncate text-[15px] leading-[1.3] font-bold">
            {product.title}
          </span>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] text-muted">
            <span
              className={`flex h-6 items-center gap-1.5 rounded-full px-[9px] text-xs font-bold ${
                onSale
                  ? "bg-success-bg text-success"
                  : "bg-danger-bg text-danger"
              }`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {onSale ? "En venta" : "Sin stock · oculto"}
            </span>
            {product.brand ? (
              <>
                <span>{product.brand}</span>
                <span aria-hidden>·</span>
              </>
            ) : null}
            <span>{formatPhotoCount(product.images.length)}</span>
          </div>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex min-w-[110px] flex-col gap-0.5">
          <span className="text-[11px] font-bold tracking-[0.08em] text-muted uppercase">
            Precio
          </span>
          <span className="text-base font-extrabold tabular-nums">
            {formatPrice(product.price)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.08em] text-muted uppercase">
            Stock
          </span>
          <div
            role="group"
            aria-label={`Stock de ${product.title}`}
            className="flex h-11 items-center rounded-full border border-line bg-page"
          >
            <button
              type="button"
              aria-label="Restar uno"
              disabled={stock === 0}
              onClick={() => changeStock(stock - 1)}
              className="flex h-[42px] w-10 items-center justify-center rounded-full disabled:opacity-35"
            >
              <Minus className="size-3.5" strokeWidth={2.6} aria-hidden />
            </button>
            <span
              aria-live="polite"
              className="min-w-[22px] text-center text-[15px] font-extrabold tabular-nums"
            >
              {stock}
            </span>
            <button
              type="button"
              aria-label="Sumar uno"
              onClick={() => changeStock(stock + 1)}
              className="flex h-[42px] w-10 items-center justify-center rounded-full"
            >
              <Plus className="size-3.5" strokeWidth={2.6} aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex gap-1.5">
          <Link
            href={`/admin/${product.id}/editar`}
            aria-label={`Editar ${product.title}`}
            title="Editar"
            className="flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:border-primary hover:text-primary"
          >
            <Pencil className="size-[18px]" strokeWidth={1.9} aria-hidden />
          </Link>
          <DeleteProductButton id={product.id} title={product.title} />
        </div>
      </div>
    </div>
  );
}
