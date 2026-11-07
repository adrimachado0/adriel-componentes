import { ProductDetailSkeleton } from "@/components/product/product-detail-skeleton";

export default function ProductLoading() {
  return (
    <div className="container-page flex flex-1 flex-col pt-1.5 pb-9 sm:pt-5 sm:pb-20">
      <ProductDetailSkeleton />
    </div>
  );
}
