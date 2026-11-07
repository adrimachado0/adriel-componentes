import { CatalogSkeleton } from "@/components/store/catalog-skeleton";

/** Home while navigating: hero + catalog placeholders (with shimmer). */
export default function HomeLoading() {
  return (
    <>
      <div className="container-page pt-4 sm:pt-6">
        <div className="h-[218px] skeleton rounded-hero-sm sm:h-[220px] sm:rounded-hero" />
      </div>
      <CatalogSkeleton />
    </>
  );
}
