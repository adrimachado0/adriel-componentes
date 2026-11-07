"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, m } from "motion/react";
import { Check, CircleAlert } from "lucide-react";

type Tone = "success" | "error";
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<
  ((message: string, tone?: Tone) => void) | null
>(null);

/** `notify("Cambios guardados")` / `notify("No se pudo…", "error")`. */
export function useToast() {
  const notify = use(ToastContext);
  if (!notify) throw new Error("useToast must be used inside <ToastProvider>");
  return notify;
}

const VISIBLE_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const notify = useCallback((message: string, tone: Tone = "success") => {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message, tone }));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => notify, [notify]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+var(--bottom-bar-h))] z-50 flex justify-center px-4 sm:bottom-[calc(24px+var(--bottom-bar-h))]"
      >
        <AnimatePresence>
          {toast ? (
            <m.div
              key={toast.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16, transition: { duration: 0.15 } }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex max-w-md items-center gap-3 rounded-card-sm bg-ink py-3 pr-5 pl-3 text-sm font-bold text-white shadow-dialog"
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  toast.tone === "success"
                    ? "bg-success-bg text-success"
                    : "bg-danger-bg text-danger"
                }`}
              >
                {toast.tone === "success" ? (
                  <Check className="size-4" strokeWidth={2.6} aria-hidden />
                ) : (
                  <CircleAlert
                    className="size-4"
                    strokeWidth={2.4}
                    aria-hidden
                  />
                )}
              </span>
              {toast.message}
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}
