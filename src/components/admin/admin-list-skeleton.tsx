/** Placeholder for the admin list (Suspense fallback and loading.tsx). */
export function AdminListSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only" role="status">
        Cargando componentes…
      </span>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="h-8 w-60 skeleton rounded-full" />
          <span className="h-4 w-56 skeleton rounded-full" />
        </div>
        <span className="h-12 w-52 skeleton rounded-full" />
      </div>
      <div className="flex flex-wrap justify-between gap-3">
        <span className="h-12 max-w-[420px] flex-[1_1_280px] skeleton rounded-full" />
        <span className="h-[52px] w-80 skeleton rounded-full" />
      </div>
      <div className="divide-y divide-line-subtle overflow-hidden rounded-card border border-line bg-surface">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3.5 px-[18px] py-3.5">
            <span className="size-[68px] skeleton rounded-photo" />
            <div className="flex flex-1 flex-col gap-2">
              <span className="h-4 w-2/3 skeleton rounded-full" />
              <span className="h-3 w-1/3 skeleton rounded-full" />
            </div>
            <span className="hidden h-11 w-56 skeleton rounded-full sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
