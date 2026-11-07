"use client";

import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
} from "react";
import { Plus } from "lucide-react";
import { useToast } from "@/components/admin/toast-provider";
import { FieldMessage } from "@/components/admin/product-form/photos-field";
import {
  createShareLink,
  type CreateShareLinkState,
} from "@/lib/actions/share-links";
import { sanitizeSlugInput } from "@/lib/slug";
import {
  SHARE_LINK_SLUG_MAX,
  SHARE_SOURCES,
  shareLinkErrorsOf,
  shareLinkFromFormData,
  shareLinkSchema,
  type ShareLinkErrors,
  type ShareSource,
} from "@/lib/validation/share-link";

const SOURCES = Object.entries(SHARE_SOURCES) as [ShareSource, string][];

/** "Nuevo link": a name (the campaign) and where it will be shared. */
export function ShareLinkForm({ siteUrl }: { siteUrl: string }) {
  const notify = useToast();
  const [slug, setSlug] = useState("");
  const [source, setSource] = useState<ShareSource>("whatsapp");
  const [errors, setErrors] = useState<ShareLinkErrors>({});
  const host = new URL(siteUrl).host;

  const [, dispatch, pending] = useActionState(
    async (prev: CreateShareLinkState, formData: FormData) => {
      const result = await createShareLink(prev, formData);
      if (result.status === "success") {
        setSlug("");
        const copied = await copy(`${siteUrl}/de/${result.slug}`);
        notify(copied ? "Link creado y copiado" : "Link creado");
      } else if (result.status === "error") {
        setErrors(result.fieldErrors);
        if (result.message) notify(result.message, "error");
      }
      return result;
    },
    { status: "idle" },
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    const parsed = shareLinkSchema.safeParse(shareLinkFromFormData(formData));
    if (!parsed.success) {
      setErrors(shareLinkErrorsOf(parsed.error));
      document.getElementById("share-link-slug")?.focus();
      return;
    }
    setErrors({});
    startTransition(() => dispatch(formData));
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby="share-link-form-title"
      className="flex flex-[1_1_340px] flex-col gap-[18px] rounded-[20px] border border-line bg-surface p-[18px] shadow-card sm:gap-5 sm:rounded-card sm:px-[clamp(18px,3vw,28px)] sm:py-6"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="share-link-form-title"
          className="text-base font-extrabold sm:text-[17px]"
        >
          Nuevo link
        </h2>
        <p className="text-[13px] text-muted">
          Ej: uno para el grupo de la facultad, otro para la familia.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="share-link-slug" className="text-sm font-bold">
          Nombre
        </label>
        <div
          className={`flex h-[50px] w-full items-center rounded-field border-[1.5px] bg-field focus-within:border-primary ${
            errors.slug ? "border-danger-input" : "border-line-strong"
          }`}
        >
          <span
            aria-hidden
            className="max-w-[55%] shrink-0 truncate pl-3.5 text-[15px] text-muted sm:pl-4"
          >
            <span className="hidden sm:inline">{host}</span>/de/
          </span>
          <input
            id="share-link-slug"
            name="slug"
            value={slug}
            maxLength={SHARE_LINK_SLUG_MAX}
            onChange={(e) => {
              setSlug(sanitizeSlugInput(e.target.value, SHARE_LINK_SLUG_MAX));
              setErrors((x) => ({ ...x, slug: undefined }));
            }}
            placeholder="facultad"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={Boolean(errors.slug) || undefined}
            aria-describedby={
              errors.slug ? "share-link-slug-error" : "share-link-slug-help"
            }
            className="h-full min-w-0 flex-1 bg-transparent pr-3.5 text-base outline-none sm:pr-4 sm:text-[15px]"
          />
        </div>
        {errors.slug ? (
          <FieldMessage id="share-link-slug-error">{errors.slug}</FieldMessage>
        ) : (
          <p id="share-link-slug-help" className="text-[13px] text-muted">
            Corto y claro: es lo que va a ver la gente en el link.
          </p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-bold">Dónde lo compartís</legend>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map(([value, label]) => (
            <label
              key={value}
              className="flex h-11 cursor-pointer items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-bold text-ink transition-colors hover:border-primary has-checked:border-primary has-checked:bg-primary-tint-strong has-checked:text-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
            >
              <input
                type="radio"
                name="source"
                value={value}
                checked={source === value}
                onChange={() => setSource(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
        {errors.source ? (
          <FieldMessage id="share-link-source-error">
            {errors.source}
          </FieldMessage>
        ) : null}
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="flex h-[50px] items-center justify-center gap-2 rounded-full bg-primary pr-[26px] pl-[22px] text-[15px] font-bold text-white shadow-primary transition-colors hover:bg-primary-hover disabled:opacity-70"
      >
        <Plus className="size-[18px]" strokeWidth={2.4} aria-hidden />
        {pending ? "Creando…" : "Crear link"}
      </button>
    </form>
  );
}

/** Copies to the clipboard; false when the browser does not allow it. */
export async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
