"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleAlert, RotateCw } from "lucide-react";
import {
  primaryActionClass,
  secondaryActionClass,
  StatusMessage,
} from "@/components/status-message";

/** Friendly error with "Reintentar" (shared by the store and the panel). */
export function ErrorView({
  error,
  retry,
  homeHref,
  homeLabel,
}: {
  error: unknown;
  retry: () => void;
  homeHref: string;
  homeLabel: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : null;

  return (
    <StatusMessage
      tone="danger"
      icon={<CircleAlert className="size-7" strokeWidth={1.9} aria-hidden />}
      title="Algo salió mal"
      actions={
        <>
          <button type="button" onClick={retry} className={primaryActionClass}>
            <RotateCw className="size-[18px]" strokeWidth={2.2} aria-hidden />
            Reintentar
          </button>
          <Link href={homeHref} className={secondaryActionClass}>
            {homeLabel}
          </Link>
        </>
      }
    >
      No se pudo cargar esta página. Probá de nuevo en unos segundos; si sigue
      pasando, avisame por WhatsApp.
      {digest ? (
        <span className="mt-2 block text-xs text-placeholder">
          Código: {digest}
        </span>
      ) : null}
    </StatusMessage>
  );
}
