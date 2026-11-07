"use client";

import { useState, type DragEvent } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Camera, CircleAlert, Upload, X } from "lucide-react";
import { MAX_PHOTOS } from "@/lib/validation/product";
import type { Photo, PhotosController } from "./use-photos";

const INPUT_ID = "product-photos";

export function PhotosField({
  controller,
  error,
}: {
  controller: PhotosController;
  error?: string;
}) {
  const { photos, addFiles, remove, move } = controller;
  const [dragOver, setDragOver] = useState(false);
  const full = photos.length >= MAX_PHOTOS;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Mobile: long-press to start dragging, so scrolling still works.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const position = (id: string | number) =>
    photos.findIndex((p) => p.key === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Tomaste la foto ${position(active.id)}.`,
    onDragOver: ({ over }) =>
      over
        ? `La foto va a quedar en la posición ${position(over.id)}.`
        : undefined,
    onDragEnd: ({ over }) =>
      over
        ? `Foto movida a la posición ${position(over.id)}.`
        : "Soltaste la foto.",
    onDragCancel: () => "Se canceló el movimiento.",
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) move(String(active.id), String(over.id));
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragOver(false);
    void addFiles(
      [...event.dataTransfer.files].filter((f) => f.type.startsWith("image/")),
    );
  }

  return (
    <section
      aria-labelledby="sec-photos"
      className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-[18px] shadow-card sm:gap-4 sm:rounded-card sm:px-[clamp(18px,3vw,28px)] sm:py-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2
            id="sec-photos"
            className="text-base font-extrabold sm:text-[17px]"
          >
            Fotos
          </h2>
          <p className="hidden text-[13px] text-muted sm:block">
            La primera es la portada. Arrastralas para cambiar el orden.
          </p>
        </div>
        <span className="shrink-0 text-[13px] font-semibold text-muted tabular-nums">
          {photos.length} de {MAX_PHOTOS}
        </span>
      </div>

      <label
        htmlFor={INPUT_ID}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        aria-disabled={full || undefined}
        className={`flex cursor-pointer items-center gap-3.5 rounded-photo border-[1.5px] border-dashed bg-field p-3.5 transition-colors sm:min-h-[150px] sm:flex-col sm:justify-center sm:gap-2 sm:rounded-card-sm sm:p-6 sm:text-center ${
          dragOver ? "border-primary bg-primary-tint" : "border-dropzone"
        } ${full ? "pointer-events-none opacity-50" : ""}`}
      >
        <span className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-primary-tint-strong text-primary sm:size-12">
          <Camera
            className="size-[21px] sm:hidden"
            strokeWidth={2}
            aria-hidden
          />
          <Upload
            className="hidden size-[22px] sm:block"
            strokeWidth={2}
            aria-hidden
          />
        </span>
        <span className="flex flex-col gap-0.5 sm:gap-2">
          <span className="text-[15px] font-bold">
            <span className="sm:hidden">Agregar fotos</span>
            <span className="hidden sm:inline">Arrastrá tus fotos acá</span>
          </span>
          <span className="text-[13px] text-muted sm:hidden">
            Desde la galería o con la cámara
          </span>
          <span className="hidden text-sm text-muted sm:inline">
            o{" "}
            <span className="font-bold text-primary underline">
              elegilas desde tu dispositivo
            </span>
          </span>
          <span className="hidden text-xs text-muted sm:inline">
            JPG, PNG o WEBP · hasta {MAX_PHOTOS} fotos
          </span>
        </span>
      </label>
      <input
        id={INPUT_ID}
        type="file"
        accept="image/*"
        multiple
        disabled={full}
        className="sr-only"
        onChange={(e) => {
          void addFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      {photos.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={{
            announcements,
            screenReaderInstructions: {
              draggable:
                "Para cambiar el orden, presioná espacio, mové la foto con las flechas y presioná espacio otra vez para soltarla. Escape cancela.",
            },
          }}
        >
          <SortableContext
            items={photos.map((p) => p.key)}
            strategy={rectSortingStrategy}
          >
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(104px,1fr))] sm:gap-2.5">
              {photos.map((photo, index) => (
                <SortablePhoto
                  key={photo.key}
                  photo={photo}
                  index={index}
                  onRemove={() => remove(photo.key)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : null}

      <p className="text-[13px] text-muted sm:hidden">
        La primera es la portada. Mantené apretada una foto para cambiar el
        orden.
      </p>
      {error ? <FieldMessage id="photos-error">{error}</FieldMessage> : null}
    </section>
  );
}

function SortablePhoto({
  photo,
  index,
  onRemove,
}: {
  photo: Photo;
  index: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.key });
  const cover = index === 0;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative aspect-square touch-manipulation overflow-hidden rounded-field bg-photo sm:rounded-photo ${
        cover ? "border-2 border-primary" : "border border-line-strong"
      } ${isDragging ? "z-10 shadow-card-hover" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        aria-roledescription="foto ordenable"
        aria-label={`Foto ${index + 1}${cover ? ", portada" : ""}`}
        className="absolute inset-0 cursor-grab outline-offset-[-3px] active:cursor-grabbing"
      >
        {/* Plain <img>: previews are local blob: URLs, which next/image can't optimize. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.preview}
          alt=""
          draggable={false}
          className="pointer-events-none size-full object-contain select-none"
        />
      </div>

      {cover ? (
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 flex h-5 items-center rounded-full bg-primary px-[7px] text-[10px] font-bold text-white sm:bottom-[7px] sm:left-[7px] sm:h-[22px] sm:px-2 sm:text-[11px]">
          Portada
        </span>
      ) : (
        <span className="pointer-events-none absolute bottom-[7px] left-[7px] hidden h-[22px] min-w-[22px] items-center justify-center rounded-full bg-surface/92 px-[7px] text-[11px] font-bold text-body sm:flex">
          {index + 1}
        </span>
      )}

      {photo.status === "uploading" ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-ink/45 text-xs font-bold text-white">
          <span className="h-1.5 w-3/4 overflow-hidden rounded-full bg-white/30">
            <span
              className="block h-full rounded-full bg-white transition-[width] duration-150"
              style={{ width: `${Math.round(photo.progress * 100)}%` }}
            />
          </span>
          <span className="tabular-nums" aria-live="polite">
            {photo.progress < 1 && photo.progress > 0
              ? `${Math.round(photo.progress * 100)}%`
              : "Subiendo…"}
          </span>
        </div>
      ) : null}

      {photo.status === "error" ? (
        <div
          role="alert"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-danger-bg/92 px-2 text-center text-[11px] font-bold text-danger"
        >
          <CircleAlert className="size-5" strokeWidth={2.2} aria-hidden />
          No se subió
        </div>
      ) : null}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar foto ${index + 1}`}
        className="absolute top-0 right-0 flex size-11 items-start justify-end p-1.5 sm:p-[7px]"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-ink/75 text-white sm:size-[26px]">
          <X className="size-3 sm:size-[13px]" strokeWidth={3} aria-hidden />
        </span>
      </button>
    </li>
  );
}

export function FieldMessage({
  id,
  children,
}: {
  id: string;
  children: string;
}) {
  return (
    <p
      id={id}
      className="flex items-center gap-1.5 text-[13px] font-semibold text-danger-strong"
    >
      <CircleAlert
        className="size-[15px] shrink-0"
        strokeWidth={2.2}
        aria-hidden
      />
      {children}
    </p>
  );
}
