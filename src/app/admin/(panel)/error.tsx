"use client";

import { ErrorView } from "@/components/error-view";

export default function PanelError({
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
      homeHref="/admin"
      homeLabel="Volver al panel"
    />
  );
}
