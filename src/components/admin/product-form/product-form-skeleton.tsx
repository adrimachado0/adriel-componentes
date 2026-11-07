export function ProductFormSkeleton() {
  return (
    <div
      aria-busy="true"
      className="container-page flex flex-col gap-5 pt-6 pb-10"
    >
      <span className="sr-only" role="status">
        Cargando formulario…
      </span>
      <span className="h-4 w-36 skeleton rounded-full" />
      <span className="h-8 w-64 skeleton rounded-full" />
      <span className="h-4 w-96 max-w-full skeleton rounded-full" />
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-5">
          {[220, 360, 200].map((h) => (
            <div
              key={h}
              style={{ height: h }}
              className="skeleton rounded-card"
            />
          ))}
        </div>
        <div className="hidden h-[440px] max-w-[400px] flex-[1_1_320px] skeleton rounded-card lg:block" />
      </div>
    </div>
  );
}
