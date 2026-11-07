import { Suspense } from "react";
import { Catalog } from "@/components/store/catalog";
import { CatalogSkeleton } from "@/components/store/catalog-skeleton";
import { Hero } from "@/components/store/hero";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <>
      {/* Cached data: part of the static shell. */}
      <Hero />
      {/* ?marca= is request data: streams in behind a skeleton. */}
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </>
  );
}
