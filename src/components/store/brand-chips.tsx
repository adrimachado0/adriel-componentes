import Link from "next/link";

type BrandChipsProps = {
  brands: string[];
  activeBrand: string | undefined;
};

function brandHref(brand: string | undefined) {
  return brand ? `/?marca=${encodeURIComponent(brand)}` : "/";
}

/** Brand filter. Plain links: the filter lives in the URL (?marca=) and is applied on the server. */
export function BrandChips({ brands, activeBrand }: BrandChipsProps) {
  const chips: { label: string; brand: string | undefined }[] = [
    { label: "Todas", brand: undefined },
    ...brands.map((brand) => ({ label: brand, brand })),
  ];

  return (
    <nav
      aria-label="Filtrar por marca"
      className="-mx-4 scrollbar-none flex gap-2 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:px-0"
    >
      {chips.map(({ label, brand }) => {
        const active = brand === activeBrand;
        return (
          <Link
            prefetch
            key={label}
            href={brandHref(brand)}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={`flex h-11 shrink-0 items-center rounded-full border px-[18px] text-sm font-semibold whitespace-nowrap transition-colors ${
              active
                ? "border-primary bg-primary text-white"
                : "border-line-chip bg-surface text-ink hover:border-primary"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
