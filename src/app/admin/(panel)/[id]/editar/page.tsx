import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form/product-form";
import { ProductFormSkeleton } from "@/components/admin/product-form/product-form-skeleton";
import { requireAdminPage } from "@/lib/auth";
import { getEditableProduct, getUsedBrands } from "@/lib/data/admin-products";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = { title: "Editar componente" };

export default function EditProductPage({
  params,
}: PageProps<"/admin/[id]/editar">) {
  return (
    <Suspense fallback={<ProductFormSkeleton />}>
      <EditProduct params={params} />
    </Suspense>
  );
}

async function EditProduct({
  params,
}: Pick<PageProps<"/admin/[id]/editar">, "params">) {
  const [{ supabase }, { id }] = await Promise.all([
    requireAdminPage(),
    params,
  ]);
  const [product, brands] = await Promise.all([
    getEditableProduct(supabase, id),
    getUsedBrands(supabase),
  ]);
  if (!product) notFound();
  // key: a fresh form state per product.
  return (
    <ProductForm
      key={product.id}
      product={product}
      brands={brands}
      siteHost={new URL(getSiteUrl()).host}
    />
  );
}
