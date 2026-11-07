"use client";

import { useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { AnimatePresence, m, type PanInfo } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImagePlaceholderIcon } from "@/components/icons";
import { productImageUrl } from "@/lib/site";

type ProductGalleryProps = {
  images: string[];
  title: string;
  lastUnit: boolean;
};

const SWIPE_THRESHOLD = 50;

/**
 * Detail gallery: crossfade between photos, arrows + thumbnails on desktop,
 * swipe + dots on mobile, ← → keys when focused.
 */
export function ProductGallery({
  images,
  title,
  lastUnit,
}: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const hasMany = count > 1;
  const current = images[index];

  const go = (next: number) => setIndex((next + count) % count);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!hasMany) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_THRESHOLD) go(index + 1);
    else if (info.offset.x > SWIPE_THRESHOLD) go(index - 1);
  }

  return (
    <div
      role="region"
      aria-roledescription="galería"
      aria-label={`Fotos de ${title}`}
      onKeyDown={onKeyDown}
      className="flex min-w-0 flex-col gap-2.5 sm:gap-3"
    >
      <div className="relative aspect-square overflow-hidden rounded-hero-sm border border-line bg-photo sm:aspect-[4/3] sm:rounded-hero">
        {current ? (
          <AnimatePresence initial={false}>
            <m.div
              key={current}
              className="absolute inset-0 touch-pan-y"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              drag={hasMany ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              dragSnapToOrigin
              onDragEnd={onDragEnd}
            >
              <Image
                src={productImageUrl(current)}
                alt={
                  hasMany ? `${title} (foto ${index + 1} de ${count})` : title
                }
                fill
                sizes="(min-width: 1200px) 620px, (min-width: 640px) 52vw, 100vw"
                preload={index === 0}
                draggable={false}
                className="pointer-events-none object-contain select-none"
              />
            </m.div>
          </AnimatePresence>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-primary">
            <ImagePlaceholderIcon className="size-24 sm:size-32" />
            <span className="sr-only">Sin fotos</span>
          </span>
        )}

        {lastUnit ? (
          <span className="absolute top-3.5 left-3.5 flex h-7 items-center rounded-full bg-primary px-[11px] text-xs font-bold text-white sm:top-4 sm:left-4 sm:h-[30px] sm:px-3 sm:text-[13px]">
            Última unidad
          </span>
        ) : null}

        {hasMany ? (
          <>
            <span className="absolute top-3.5 right-3.5 flex h-7 items-center rounded-full bg-chip-dark px-[11px] text-xs font-bold text-white tabular-nums sm:top-auto sm:right-4 sm:bottom-4 sm:h-[30px] sm:px-3 sm:text-[13px]">
              {index + 1} / {count}
            </span>
            <GalleryArrow side="left" onClick={() => go(index - 1)} />
            <GalleryArrow side="right" onClick={() => go(index + 1)} />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-3.5 flex items-center justify-center gap-[5px] sm:hidden"
            >
              {images.map((path, i) => (
                <span
                  key={path}
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ${
                    i === index
                      ? "w-[18px] bg-primary"
                      : "w-1.5 bg-primary-soft"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {hasMany ? (
        <div
          role="group"
          aria-label="Elegir foto"
          className="scrollbar-none flex gap-2 overflow-x-auto p-0.5 sm:gap-2.5"
        >
          {images.map((path, i) => (
            <button
              key={path}
              type="button"
              aria-label={`Ver foto ${i + 1} de ${count}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className={`relative size-16 shrink-0 overflow-hidden rounded-field bg-photo sm:size-[84px] sm:rounded-photo ${
                i === index
                  ? "border-2 border-primary"
                  : "border border-line-strong"
              }`}
            >
              <Image
                src={productImageUrl(path)}
                alt=""
                fill
                sizes="84px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function GalleryArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Foto anterior" : "Foto siguiente"}
      onClick={onClick}
      className={`absolute top-1/2 hidden size-[46px] -translate-y-1/2 items-center justify-center rounded-full bg-surface/92 text-ink shadow-float sm:flex ${
        side === "left" ? "left-3.5" : "right-3.5"
      }`}
    >
      <Icon className="size-5" strokeWidth={2.2} aria-hidden />
    </button>
  );
}
