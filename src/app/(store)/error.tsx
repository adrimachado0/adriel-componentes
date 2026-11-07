"use client";

import { ErrorView } from "@/components/error-view";

export default function StoreError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <ErrorView
      error={error}
      retry={retry}
      homeHref="/"
      homeLabel="Ir al inicio"
    />
  );
}
