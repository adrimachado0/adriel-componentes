"use client";

import { CircleAlert, ImageUp, Lightbulb, Trash2 } from "lucide-react";
import { ImagePlaceholderIcon } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";
import { SHARE_IMAGE } from "@/lib/share-image";
import { FieldMessage } from "./photos-field";
import type { ShareImageController } from "./use-share-image";

const INPUT_ID = "product-share-image";
const TARGET_RATIO = SHARE_IMAGE.width / SHARE_IMAGE.height;

/**
 * Optional Open Graph image ("Imagen para compartir"). Without one, the cover
 * photo is used. Shows a link-preview mock of what WhatsApp & co. display.
 */
export function ShareImageField({
  controller,
  coverPreview,
  title,
  price,
  error,
}: {
  controller: ShareImageController;
  /** Preview URL of the first photo (fallback share image). */
  coverPreview: string | undefined;
  title: string;
  price: number;
  error?: string;
}) {
  const { image, setFile, clear } = controller;
  const custom = image && image.status !== "error" ? image : null;

  const tooSmall =
    custom?.width !== undefined &&
    custom.height !== undefined &&
    (custom.width < SHARE_IMAGE.width || custom.height < SHARE_IMAGE.height);
  const willCrop =
    custom?.width !== undefined &&
    custom.height !== undefined &&
    Math.abs(custom.width / custom.height - TARGET_RATIO) / TARGET_RATIO > 0.08;

  return (
    <section
      aria-labelledby="sec-share"
      className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-[18px] shadow-card sm:gap-4 sm:rounded-card sm:px-[clamp(18px,3vw,28px)] sm:py-6"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="sec-share"
          className="flex items-center gap-2 text-base font-extrabold sm:text-[17px]"
        >
          Imagen para compartir
          <span className="rounded-full bg-page px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] text-muted uppercase">
            Opcional
          </span>
        </h2>
        <p className="text-[13px] text-muted">
          Es la que aparece al compartir el link por WhatsApp, Instagram o
          Facebook. Si no subís ninguna, se usa la portada.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Link preview mock */}
        <figure className="w-full max-w-[420px] shrink-0 overflow-hidden rounded-photo border border-line bg-surface shadow-card sm:w-[360px]">
          <div className="relative aspect-[1200/630] overflow-hidden bg-photo">
            {custom ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={custom.preview}
                alt=""
                className="size-full object-cover"
              />
            ) : coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreview}
                alt=""
                className="size-full object-contain"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-primary">
                <ImagePlaceholderIcon className="size-14" />
              </span>
            )}
            {custom?.status === "uploading" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-ink/45 text-xs font-bold text-white">
                <span className="h-1.5 w-1/2 overflow-hidden rounded-full bg-white/30">
                  <span
                    className="block h-full rounded-full bg-white transition-[width] duration-150"
                    style={{ width: `${Math.round(custom.progress * 100)}%` }}
                  />
                </span>
                <span aria-live="polite">Subiendo…</span>
              </div>
            ) : null}
          </div>
          <figcaption className="flex flex-col gap-0.5 border-t border-line px-3.5 py-3">
            <span className="text-[11px] font-semibold tracking-[0.04em] text-muted uppercase">
              {SITE_NAME}
            </span>
            <span
              className={`line-clamp-2 text-sm font-bold ${title ? "text-ink" : "text-placeholder"}`}
            >
              {title || "Título del componente"}
              {Number.isFinite(price) && price > 0
                ? ` · ${formatPrice(price)}`
                : ""}
            </span>
            <span className="text-xs text-muted">
              {custom ? "Usando tu imagen para compartir" : "Usando la portada"}
            </span>
          </figcaption>
        </figure>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={INPUT_ID}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm font-bold transition-colors hover:border-primary hover:text-primary"
            >
              <ImageUp className="size-[18px]" strokeWidth={1.9} aria-hidden />
              {custom ? "Cambiar imagen" : "Subir imagen"}
            </label>
            <input
              id={INPUT_ID}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-describedby="share-tip"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void setFile(file);
                e.target.value = "";
              }}
            />
            {custom ? (
              <button
                type="button"
                onClick={clear}
                className="flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-muted transition-colors hover:text-danger-strong"
              >
                <Trash2 className="size-4" strokeWidth={1.9} aria-hidden />
                Quitar y usar la portada
              </button>
            ) : null}
          </div>

          <div
            id="share-tip"
            className="flex gap-2.5 rounded-field bg-primary-tint px-3.5 py-3 text-[13px] leading-normal text-body"
          >
            <Lightbulb
              className="mt-px size-4 shrink-0 text-primary"
              strokeWidth={2}
              aria-hidden
            />
            <div className="flex flex-col gap-1">
              <p>
                <strong className="font-bold text-ink">Medida ideal:</strong>{" "}
                <span className="font-semibold whitespace-nowrap text-ink">
                  {SHARE_IMAGE.width} × {SHARE_IMAGE.height} px
                </span>{" "}
                (horizontal, proporción 1.91:1). Mínimo{" "}
                <span className="whitespace-nowrap">
                  {SHARE_IMAGE.minWidth} × {SHARE_IMAGE.minHeight} px
                </span>
                .
              </p>
              <p>
                Dejá lo importante en el centro: en algunos chats WhatsApp la
                muestra recortada en cuadrado. Si tiene otra proporción, se
                recorta desde el centro.
              </p>
            </div>
          </div>

          {custom?.status === "done" && (tooSmall || willCrop) ? (
            <p className="flex items-start gap-1.5 text-[13px] font-semibold text-warning">
              <CircleAlert
                className="mt-0.5 size-[15px] shrink-0"
                strokeWidth={2.2}
                aria-hidden
              />
              {tooSmall
                ? `Es más chica que lo recomendado (${custom.width} × ${custom.height} px): puede verse borrosa.`
                : "Tiene otra proporción: se va a recortar desde el centro (mirá la vista previa)."}
            </p>
          ) : null}
          {error ? (
            <FieldMessage id="share-image-error">{error}</FieldMessage>
          ) : null}
        </div>
      </div>
    </section>
  );
}
