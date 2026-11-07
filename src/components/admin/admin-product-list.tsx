"use client";

import { useOptimistic, useTransition, type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { reorderProducts } from "@/lib/actions/products";
import type { AdminProduct } from "@/lib/data/admin-products";
import { AdminProductRow } from "./admin-product-row";
import { useToast } from "./toast-provider";

/**
 * The admin list, reorderable by dragging the handle (or with the keyboard).
 * The order is the one the store uses. When the list is filtered, only the
 * visible products swap places among themselves.
 */
export function AdminProductList({ products }: { products: AdminProduct[] }) {
  const [ordered, setOptimisticOrder] = useOptimistic(products);
  const [, startTransition] = useTransition();
  const notify = useToast();

  const sensors = useSensors(
    // Only the handle starts a drag (touch-action: none on it), so the rest
    // of the row scrolls normally on mobile.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const titleOf = (id: string | number) =>
    ordered.find((p) => p.id === id)?.title ?? "el componente";
  const positionOf = (id: string | number) =>
    ordered.findIndex((p) => p.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Tomaste ${titleOf(active.id)}.`,
    onDragOver: ({ over }) =>
      over ? `Va a quedar en la posición ${positionOf(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${titleOf(active.id)} quedó en la posición ${positionOf(over.id)}.`
        : "Soltaste el componente.",
    onDragCancel: () => "Se canceló el movimiento.",
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = ordered.findIndex((p) => p.id === active.id);
    const to = ordered.findIndex((p) => p.id === over.id);
    const next = arrayMove(ordered, from, to);
    // Optimistic: the row stays where it was dropped; if saving fails, React
    // goes back to the server order when the transition ends.
    startTransition(async () => {
      setOptimisticOrder(next);
      const result = await reorderProducts(next.map((p) => p.id));
      if (!result.ok) notify(result.error, "error");
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Para cambiar el orden, presioná espacio, mové el componente con las flechas y presioná espacio otra vez para soltarlo. Escape cancela.",
        },
      }}
    >
      <SortableContext
        items={ordered.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="divide-y divide-line-subtle">
          {ordered.map((product) => (
            <SortableItem
              key={product.id}
              id={product.id}
              title={product.title}
            >
              {(handle) => (
                <AdminProductRow product={product} dragHandle={handle} />
              )}
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: (handle: ReactNode) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="componente ordenable"
      aria-label={`Mover ${title}`}
      title="Arrastrá para cambiar el orden"
      className="-mr-1.5 -ml-2 flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-field text-muted transition-colors hover:text-ink active:cursor-grabbing sm:-ml-2.5"
    >
      <GripVertical className="size-5" strokeWidth={2} aria-hidden />
    </button>
  );

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={
        isDragging ? "relative z-10 bg-surface shadow-card-hover" : undefined
      }
    >
      {children(handle)}
    </li>
  );
}
