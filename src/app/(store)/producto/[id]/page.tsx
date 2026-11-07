import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductDetailSkeleton } from "@/components/product/product-detail-skeleton";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { RelatedProducts } from "@/components/product/related-products";
import {
  getProduct,
  getRelatedProducts,
  getStoreProducts,
} from "@/lib/data/products";
import { formatPrice, formatStockLabel } from "@/lib/format";
import { contact, SITE_NAME } from "@/lib/site";
import { productShareImagePath, SHARE_IMAGE } from "@/lib/share-image";
import { productMessage, whatsappUrl } from "@/lib/whatsapp";

/** Prerender every product in stock (sold ones render on demand); new ones get the App Shell, then their own entry. */
export async function generateStaticParams() {
  const products = await getStoreProducts();
  // Cache Components needs at least one param; the placeholder renders a 404.
  return products.length > 0
    ? products.map((p) => ({ id: p.id }))
    : [{ id: "placeholder" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/producto/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Componente no encontrado" };

  const title = product.brand
    ? `${product.title} (${product.brand})`
    : product.title;
  const shareTitle = `${title} · ${formatPrice(product.price)}`;
  const description =
    excerpt(product.description, 160) ||
    `${formatPrice(product.price)} · Consultá por WhatsApp.`;
  // Custom share image if uploaded, else the cover (see compartir.jpg/route.ts).
  const shareImage = {
    url: productShareImagePath(product.id, product.updated_at),
    width: SHARE_IMAGE.width,
    height: SHARE_IMAGE.height,
    type: "image/jpeg",
    alt: product.title,
  };

  return {
    title,
    description,
    alternates: { canonical: `/producto/${product.id}` },
    openGraph: {
      type: "website",
      locale: "es_AR",
      siteName: SITE_NAME,
      title: shareTitle,
      description,
      url: `/producto/${product.id}`,
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [shareImage],
    },
  };
}

export default function ProductPage({ params }: PageProps<"/producto/[id]">) {
  return (
    <div className="container-page flex flex-1 flex-col pt-1.5 pb-9 sm:pt-5 sm:pb-20">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ProductDetail({
  params,
}: Pick<PageProps<"/producto/[id]">, "params">) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const whatsappHref = whatsappUrl(
    contact.whatsappNumber,
    productMessage(product),
  );
  const paragraphs = product.description
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      {/* Mobile: back link. Desktop: breadcrumb. */}
      <Link
        prefetch
        href="/#componentes"
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 self-start px-2 text-sm font-semibold text-muted sm:hidden"
      >
        <ChevronLeft className="size-4" strokeWidth={2.2} aria-hidden />
        Componentes
      </Link>
      <nav
        aria-label="Ruta de navegación"
        className="mb-6 hidden min-w-0 items-center gap-2 text-sm text-muted sm:flex"
      >
        <Link
          prefetch
          href="/"
          className="font-semibold whitespace-nowrap hover:underline"
        >
          Inicio
        </Link>
        <ChevronRight
          className="size-3.5 shrink-0"
          strokeWidth={2}
          aria-hidden
        />
        <Link
          prefetch
          href="/#componentes"
          className="font-semibold whitespace-nowrap hover:underline"
        >
          Componentes
        </Link>
        <ChevronRight
          className="size-3.5 shrink-0"
          strokeWidth={2}
          aria-hidden
        />
        <span
          aria-current="page"
          className="min-w-0 truncate font-semibold text-ink"
        >
          {product.title}
        </span>
      </nav>

      <article className="flex flex-col gap-[22px] sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-12 sm:gap-y-8">
        <div className="min-w-0 sm:flex-[1_1_480px]">
          <ProductGallery
            images={product.images}
            title={product.title}
            stock={product.stock}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4 sm:flex-[1_1_380px] sm:gap-5">
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {product.brand ? (
              <span className="text-xs font-bold tracking-[0.08em] text-primary uppercase sm:text-[13px]">
                {product.brand}
              </span>
            ) : null}
            <h1 className="text-2xl leading-[1.2] font-extrabold tracking-[-0.025em] text-pretty sm:text-[clamp(26px,3vw,34px)] sm:leading-[1.15]">
              {product.title}
            </h1>
            <StockTag stock={product.stock} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em] tabular-nums sm:text-[40px]">
              {formatPrice(product.price)}
            </span>
            <span className="text-[13px] text-muted sm:text-sm">
              Consultá forma de pago y entrega por WhatsApp.
            </span>
          </div>

          {paragraphs.length > 0 ? (
            <>
              <hr className="border-line" />
              <div className="flex flex-col gap-2">
                <h2 className="text-base font-extrabold">Descripción</h2>
                {paragraphs.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-[15px] leading-[1.6] text-pretty text-body sm:leading-[1.65]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </>
          ) : null}

          <hr className="border-line" />
          <ProductPurchase
            productId={product.id}
            price={product.price}
            stock={product.stock}
            whatsappHref={whatsappHref}
          />
        </div>
      </article>

      <RelatedProducts products={related} />
    </>
  );
}

function StockTag({ stock }: { stock: number }) {
  const tone =
    stock < 1
      ? "bg-line-subtle text-muted"
      : stock === 1
        ? "bg-warning-bg text-warning"
        : "bg-success-bg text-success";
  return (
    <span
      className={`flex h-7 items-center gap-[7px] self-start rounded-full px-[11px] text-[13px] font-bold ${tone}`}
    >
      <span className="size-[7px] rounded-full bg-current" />
      {formatStockLabel(stock)}
    </span>
  );
}

/** Single-line excerpt cut at a word boundary, with "…" when shortened. */
function excerpt(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:–-]+$/, "")}…`;
}
