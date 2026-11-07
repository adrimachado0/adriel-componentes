/** Placeholder while a product page streams in (same layout as the detail). */
export function ProductDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only" role="status">
        Cargando componente…
      </span>
      <div className="hidden h-5 w-80 skeleton rounded-full sm:block" />
      <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-12 sm:gap-y-8">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-[1_1_480px]">
          <div className="aspect-square skeleton rounded-hero-sm sm:aspect-[4/3] sm:rounded-hero" />
          <div className="flex gap-2.5">
            {Array.from({ length: 4 }, (_, i) => (
              <span
                key={i}
                className="size-16 skeleton rounded-field sm:size-[84px] sm:rounded-photo"
              />
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-4 sm:flex-[1_1_380px]">
          <span className="h-3.5 w-16 skeleton rounded-full" />
          <span className="h-8 w-11/12 skeleton rounded-full" />
          <span className="h-7 w-28 skeleton rounded-full" />
          <span className="h-10 w-44 skeleton rounded-full" />
          <span className="h-24 w-full skeleton rounded-field" />
          <span className="hidden h-[54px] w-full skeleton rounded-full sm:block" />
          <span className="hidden h-[54px] w-full skeleton rounded-full sm:block" />
        </div>
      </div>
    </div>
  );
}
