import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form/product-form";
import { ProductFormSkeleton } from "@/components/admin/product-form/product-form-skeleton";
import { requireAdminPage } from "@/lib/auth";
import { getUsedBrands } from "@/lib/data/admin-products";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = { title: "Nuevo componente" };

export default function NewProductPage() {
  return (
    <Suspense fallback={<ProductFormSkeleton />}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  const { supabase } = await requireAdminPage();
  const brands = await getUsedBrands(supabase);
  return <ProductForm brands={brands} siteHost={new URL(getSiteUrl()).host} />;
}
