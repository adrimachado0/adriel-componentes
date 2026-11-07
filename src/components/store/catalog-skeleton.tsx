import { CatalogLayout } from "@/components/store/catalog";

const CHIP_WIDTHS = [
  "w-[84px]",
  "w-16",
  "w-[124px]",
  "w-20",
  "w-[92px]",
  "w-24",
];

export function CatalogSkeleton() {
  return (
    <div aria-busy="true" className="contents">
      <span className="sr-only" role="status">
        Cargando componentes…
      </span>
      <CatalogLayout
        count={null}
        chips={
          <div className="-mx-4 flex gap-2 overflow-hidden px-4 sm:mx-0 sm:px-0">
            {CHIP_WIDTHS.map((width) => (
              <span
                key={width}
                className={`h-11 shrink-0 skeleton rounded-full ${width}`}
              />
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] sm:gap-5">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </CatalogLayout>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-card-sm border border-line bg-surface p-1.5 shadow-card sm:gap-3 sm:rounded-card sm:p-2.5">
      <div className="aspect-square skeleton rounded-photo-sm sm:aspect-[4/3] sm:rounded-photo" />
      <div className="flex flex-col gap-2 px-1 pb-1 sm:px-1.5 sm:pb-1.5">
        <span className="h-4 w-11/12 skeleton rounded-full" />
        <span className="h-4 w-2/3 skeleton rounded-full" />
        <span className="h-3 w-1/2 skeleton rounded-full" />
        <span className="mt-2 h-6 w-24 skeleton rounded-full" />
        <span className="h-11 skeleton rounded-full" />
      </div>
    </div>
  );
}
