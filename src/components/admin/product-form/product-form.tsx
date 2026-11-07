"use client";

import {
  startTransition,
  useActionState,
  useCallback,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CircleAlert, Minus, Plus } from "lucide-react";
import { useToast } from "@/components/admin/toast-provider";
import { saveProduct, type SaveProductState } from "@/lib/actions/products";
import type { EditableProduct } from "@/lib/data/admin-products";
import { formatThousands } from "@/lib/format";
import {
  DESCRIPTION_MAX,
  errorSummary,
  fieldErrorsOf,
  parsePriceInput,
  productFromFormData,
  productSchema,
  STOCK_MAX,
  TITLE_MAX,
  BRAND_MAX,
  type FieldErrors,
  type ProductField,
} from "@/lib/validation/product";
import { FieldMessage, PhotosField } from "./photos-field";
import { PreviewCard } from "./preview-card";
import { usePhotos } from "./use-photos";

const FIELD_ORDER: ProductField[] = [
  "images",
  "title",
  "brand",
  "description",
  "price",
  "stock",
];
const FIELD_INPUT_ID: Record<ProductField, string> = {
  images: "product-photos",
  title: "product-title",
  brand: "product-brand",
  description: "product-description",
  price: "product-price",
  stock: "product-stock",
};

type ProductFormProps = {
  product?: EditableProduct;
  brands: string[];
};

export function ProductForm({ product, brands }: ProductFormProps) {
  const isEdit = Boolean(product);
  const router = useRouter();
  const notify = useToast();
  const onPhotoError = useCallback((m: string) => notify(m, "error"), [notify]);
  const photos = usePhotos(product?.images ?? [], onPhotoError);

  const [title, setTitle] = useState(product?.title ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceText, setPriceText] = useState(
    product ? formatThousands(product.price) : "",
  );
  const [stock, setStock] = useState(product?.stock ?? 1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const summaryRef = useRef<HTMLDivElement>(null);

  const [, dispatch, pending] = useActionState(
    async (prev: SaveProductState, formData: FormData) => {
      const result = await saveProduct(prev, formData);
      if (result.status === "success") {
        photos.markSaved();
        notify(result.created ? "Componente publicado" : "Cambios guardados");
        router.push("/admin");
      } else if (result.status === "error") {
        setErrors(result.fieldErrors);
        if (result.message) notify(result.message, "error");
      }
      return result;
    },
    { status: "idle" },
  );

  const price = parsePriceInput(priceText);
  const previewPhotos = photos.photos
    .filter((p) => p.status !== "error")
    .map((p) => p.preview);

  const dirty =
    !product ||
    title !== product.title ||
    brand !== product.brand ||
    description !== product.description ||
    price !== product.price ||
    stock !== product.stock ||
    photos.paths.join() !== product.images.join() ||
    photos.uploading;

  function clearError(field: ProductField) {
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (photos.uploading || pending) return;

    const formData = new FormData(event.currentTarget);
    formData.set("price", String(Number.isFinite(price) ? price : ""));
    formData.set("images", JSON.stringify(photos.paths));
    if (product) formData.set("id", product.id);

    // Same zod schema as the server: instant inline errors.
    const parsed = productSchema.safeParse(productFromFormData(formData));
    if (!parsed.success) {
      const fieldErrors = fieldErrorsOf(parsed.error);
      setErrors(fieldErrors);
      const first = FIELD_ORDER.find((f) => fieldErrors[f]);
      requestAnimationFrame(() => {
        summaryRef.current?.scrollIntoView({ block: "center" });
        if (first)
          document
            .getElementById(FIELD_INPUT_ID[first])
            ?.focus({ preventScroll: true });
      });
      return;
    }
    setErrors({});
    startTransition(() => dispatch(formData));
  }

  function cancel() {
    photos.discardUnsaved();
    router.push("/admin");
  }

  const summary = errorSummary(errors);
  const status = photos.uploading
    ? { label: "Subiendo fotos…", dot: "bg-pending" }
    : !isEdit
      ? { label: "Sin publicar", dot: "bg-pending" }
      : dirty
        ? { label: "Cambios sin guardar", dot: "bg-pending" }
        : stock > 0
          ? { label: "Publicado", dot: "bg-success" }
          : { label: "Sin stock · oculto", dot: "bg-danger" };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col">
      <div className="container-page flex flex-1 flex-col gap-4 pt-2 pb-7 sm:gap-5 sm:pt-6 sm:pb-10">
        <div className="flex flex-col gap-1.5 sm:gap-2.5">
          <Link
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              cancel();
            }}
            className="-ml-1.5 flex min-h-11 items-center gap-1.5 self-start px-1.5 text-sm font-semibold text-muted hover:text-ink sm:ml-0 sm:min-h-8 sm:px-0"
          >
            <ArrowLeft className="size-4" strokeWidth={2.2} aria-hidden />
            Mis componentes
          </Link>
          <h1 className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.025em] sm:text-[30px]">
            {isEdit ? "Editar componente" : "Nuevo componente"}
          </h1>
          <p className="text-sm leading-normal text-muted sm:text-[15px]">
            {isEdit
              ? "Los cambios se ven en la tienda apenas los guardes."
              : "Completá los datos y publicalo. Lo vas a poder editar cuando quieras."}
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-4 sm:gap-5">
            <div ref={summaryRef}>
              {summary ? (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-card-sm border border-danger-border bg-danger-bg px-[18px] py-4 text-danger-text"
                >
                  <CircleAlert
                    className="mt-px size-5 shrink-0"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold">{summary.title}</span>
                    <span className="text-[13px] leading-[1.45]">
                      {summary.detail}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            <PhotosField controller={photos} error={errors.images} />

            <FormSection
              id="sec-info"
              title="Información"
              hint="Lo que ve el comprador en la tarjeta y en el detalle."
            >
              <Field
                id={FIELD_INPUT_ID.title}
                label="Título"
                counter={`${title.length}/${TITLE_MAX}`}
                error={errors.title}
              >
                <input
                  id={FIELD_INPUT_ID.title}
                  name="title"
                  value={title}
                  maxLength={TITLE_MAX}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearError("title");
                  }}
                  placeholder="Ej: Memoria RAM Fury Beast 16 GB DDR4"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.title) || undefined}
                  aria-describedby={
                    errors.title ? `${FIELD_INPUT_ID.title}-error` : undefined
                  }
                  className={inputClass(errors.title)}
                />
              </Field>

              <Field
                id={FIELD_INPUT_ID.brand}
                label="Marca"
                error={errors.brand}
              >
                <input
                  id={FIELD_INPUT_ID.brand}
                  name="brand"
                  value={brand}
                  maxLength={BRAND_MAX}
                  onChange={(e) => {
                    setBrand(e.target.value);
                    clearError("brand");
                  }}
                  placeholder="Ej: Kingston"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.brand) || undefined}
                  className={inputClass(errors.brand)}
                />
                {brands.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="hidden text-[13px] text-muted sm:inline">
                      Ya usadas:
                    </span>
                    {brands.map((b) => {
                      const active =
                        b.toLowerCase() === brand.trim().toLowerCase();
                      return (
                        <button
                          key={b}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setBrand(b);
                            clearError("brand");
                          }}
                          className={`h-[34px] rounded-full border px-3 text-[13px] font-bold sm:h-9 sm:px-3.5 ${
                            active
                              ? "border-primary bg-primary-tint-strong text-primary"
                              : "border-line-strong bg-surface text-ink hover:border-primary"
                          }`}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </Field>

              <Field
                id={FIELD_INPUT_ID.description}
                label="Descripción"
                counter={`${description.length}/${DESCRIPTION_MAX}`}
                error={errors.description}
                help={
                  <span className="hidden sm:inline">
                    Tip: contá por qué lo vendés y si incluye caja o accesorios.
                  </span>
                }
              >
                <textarea
                  id={FIELD_INPUT_ID.description}
                  name="description"
                  rows={5}
                  value={description}
                  maxLength={DESCRIPTION_MAX}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearError("description");
                  }}
                  placeholder="Estado, qué incluye y cualquier detalle a tener en cuenta."
                  aria-invalid={Boolean(errors.description) || undefined}
                  className={`${inputClass(errors.description)} h-auto min-h-[136px] resize-none py-3 leading-normal sm:min-h-[132px] sm:resize-y sm:py-3.5`}
                />
              </Field>
            </FormSection>

            <FormSection
              id="sec-price"
              title="Precio y stock"
              hint="Con 0 unidades el componente se oculta de la tienda."
            >
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))]">
                <Field
                  id={FIELD_INPUT_ID.price}
                  label="Precio"
                  error={errors.price}
                  help={
                    errors.price ? undefined : (
                      <span className="hidden sm:inline">
                        En pesos, sin centavos.
                      </span>
                    )
                  }
                >
                  <div className="relative">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-base font-bold text-muted sm:left-4 sm:text-[15px]"
                    >
                      $
                    </span>
                    <input
                      id={FIELD_INPUT_ID.price}
                      name="price"
                      inputMode="numeric"
                      autoComplete="off"
                      value={priceText}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 9);
                        setPriceText(
                          digits ? formatThousands(Number(digits)) : "",
                        );
                        clearError("price");
                      }}
                      placeholder="0"
                      aria-invalid={Boolean(errors.price) || undefined}
                      aria-describedby={
                        errors.price
                          ? `${FIELD_INPUT_ID.price}-error`
                          : undefined
                      }
                      className={`${inputClass(errors.price)} pl-8 font-bold tabular-nums sm:pl-[34px] sm:text-base`}
                    />
                  </div>
                </Field>

                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-stretch sm:gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label
                      htmlFor={FIELD_INPUT_ID.stock}
                      className="text-sm font-bold"
                    >
                      Cantidad
                    </label>
                    <span className="text-[13px] text-muted sm:hidden">
                      Unidades para vender
                    </span>
                  </div>
                  <div className="flex h-[50px] items-center justify-between rounded-field border-[1.5px] border-line-strong bg-field px-[3px]">
                    <button
                      type="button"
                      aria-label="Restar uno"
                      disabled={stock <= 0}
                      onClick={() => setStock((s) => Math.max(0, s - 1))}
                      className="flex size-11 items-center justify-center rounded-[11px] disabled:opacity-35"
                    >
                      <Minus className="size-4" strokeWidth={2.4} aria-hidden />
                    </button>
                    <input
                      id={FIELD_INPUT_ID.stock}
                      name="stock"
                      inputMode="numeric"
                      autoComplete="off"
                      value={stock}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        setStock(
                          Math.min(STOCK_MAX, digits ? Number(digits) : 0),
                        );
                        clearError("stock");
                      }}
                      className="h-11 w-10 bg-transparent text-center text-base font-extrabold tabular-nums outline-none sm:w-16"
                    />
                    <button
                      type="button"
                      aria-label="Sumar uno"
                      disabled={stock >= STOCK_MAX}
                      onClick={() =>
                        setStock((s) => Math.min(STOCK_MAX, s + 1))
                      }
                      className="flex size-11 items-center justify-center rounded-[11px] disabled:opacity-35"
                    >
                      <Plus className="size-4" strokeWidth={2.4} aria-hidden />
                    </button>
                  </div>
                  <p className="hidden text-[13px] text-muted sm:block">
                    Unidades disponibles para vender.
                  </p>
                </div>
              </div>
            </FormSection>
          </div>

          <PreviewCard
            title={title.trim()}
            brand={brand.trim()}
            description={description.trim()}
            price={price}
            stock={stock}
            photos={previewPhotos}
          />
        </div>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-line bg-surface/96 shadow-bar sm:bg-surface/94 sm:shadow-none sm:backdrop-blur-md sm:backdrop-saturate-[1.4]">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] sm:py-3.5">
          <span
            className="hidden items-center gap-2 text-sm text-muted sm:flex"
            aria-live="polite"
          >
            <span className={`size-2 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <div className="flex flex-1 gap-2.5 sm:ml-auto sm:flex-none">
            <button
              type="button"
              onClick={cancel}
              className="flex h-[50px] items-center rounded-full border border-line-strong bg-surface px-5 text-[15px] font-bold sm:px-[22px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending || photos.uploading}
              className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-full bg-primary pr-[26px] pl-[22px] text-[15px] font-bold text-white shadow-primary transition-colors hover:bg-primary-hover disabled:opacity-70 sm:flex-none"
            >
              <Check className="size-[18px]" strokeWidth={2.2} aria-hidden />
              {pending ? (
                isEdit ? (
                  "Guardando…"
                ) : (
                  "Publicando…"
                )
              ) : photos.uploading ? (
                "Subiendo fotos…"
              ) : (
                <>
                  <span className="sm:hidden">
                    {isEdit ? "Guardar" : "Publicar"}
                  </span>
                  <span className="hidden sm:inline">
                    {isEdit ? "Guardar cambios" : "Publicar componente"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function inputClass(error?: string) {
  return `h-[50px] w-full rounded-field border-[1.5px] bg-field px-3.5 text-base outline-none focus:border-primary sm:px-4 sm:text-[15px] ${
    error ? "border-danger-input" : "border-line-strong"
  }`;
}

function FormSection({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-[18px] rounded-[20px] border border-line bg-surface p-[18px] shadow-card sm:gap-5 sm:rounded-card sm:px-[clamp(18px,3vw,28px)] sm:py-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-base font-extrabold sm:text-[17px]">
          {title}
        </h2>
        <p className="text-[13px] text-muted">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  counter,
  error,
  help,
  children,
}: {
  id: string;
  label: string;
  counter?: string;
  error?: string;
  help?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold">
          {label}
        </label>
        {counter ? (
          <span className="text-xs text-muted tabular-nums">{counter}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <FieldMessage id={`${id}-error`}>{error}</FieldMessage>
      ) : help ? (
        <p className="text-[13px] text-muted">{help}</p>
      ) : null}
    </div>
  );
}
