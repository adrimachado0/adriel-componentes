"use client";

import { useRef, useState, useTransition } from "react";
import { AnimatePresence, m } from "motion/react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/lib/actions/products";
import { useModal } from "@/lib/hooks/use-modal";
import { useToast } from "./toast-provider";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Trash button + "¿Eliminar este componente?" confirmation dialog. */
export function DeleteProductButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={`Eliminar ${title}`}
        title="Eliminar"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface text-muted transition-colors hover:border-danger-border hover:text-danger-strong"
      >
        <Trash2 className="size-[18px]" strokeWidth={1.9} aria-hidden />
      </button>
      <AnimatePresence>
        {open ? (
          <DeleteDialog id={id} title={title} onClose={() => setOpen(false)} />
        ) : null}
      </AnimatePresence>
    </>
  );
}

function DeleteDialog({
  id,
  title,
  onClose,
}: {
  id: string;
  title: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [pending, startTransition] = useTransition();
  const notify = useToast();

  // While deleting, Esc / backdrop do nothing.
  const close = () => {
    if (!pending) onClose();
  };
  useModal({
    open: true,
    containerRef: dialogRef,
    onClose: close,
    initialFocusRef: cancelRef,
  });

  function confirm() {
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result.ok) {
        notify("Componente eliminado");
        onClose();
      } else {
        notify(result.error, "error");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <m.div
        aria-hidden
        className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        onClick={close}
      />
      <m.div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`delete-title-${id}`}
        aria-describedby={`delete-desc-${id}`}
        className="relative flex w-full max-w-[420px] flex-col gap-3 rounded-dialog bg-surface p-7 shadow-dialog"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
        transition={{ duration: 0.22, ease: EASE_OUT }}
      >
        <span className="flex size-[52px] items-center justify-center rounded-full bg-danger-bg text-danger-strong">
          <Trash2 className="size-6" strokeWidth={1.9} aria-hidden />
        </span>
        <h2
          id={`delete-title-${id}`}
          className="mt-1 text-xl font-extrabold tracking-[-0.02em]"
        >
          ¿Eliminar este componente?
        </h2>
        <p
          id={`delete-desc-${id}`}
          className="text-sm leading-[1.55] text-muted"
        >
          “{title}” se va a quitar de la tienda. Esta acción no se puede
          deshacer.
        </p>
        <div className="mt-2 flex gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={close}
            disabled={pending}
            className="h-12 flex-1 rounded-full border border-line-strong bg-surface text-[15px] font-bold disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className="h-12 flex-1 rounded-full bg-danger-strong text-[15px] font-bold text-white disabled:opacity-80"
          >
            {pending ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </m.div>
    </div>
  );
}
