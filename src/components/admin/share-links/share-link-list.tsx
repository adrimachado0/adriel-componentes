"use client";

import { useState, useTransition } from "react";
import { Copy, Link2, Trash2 } from "lucide-react";
import { useToast } from "@/components/admin/toast-provider";
import { deleteShareLink } from "@/lib/actions/share-links";
import type { ShareLink } from "@/lib/data/share-links";
import { SHARE_SOURCES, type ShareSource } from "@/lib/validation/share-link";
import { copy } from "./share-link-form";

export function ShareLinkList({
  links,
  siteUrl,
}: {
  links: ShareLink[];
  siteUrl: string;
}) {
  return (
    <section
      aria-labelledby="share-links-title"
      className="flex min-w-0 flex-[2_1_420px] flex-col overflow-hidden rounded-[20px] border border-line bg-surface shadow-card sm:rounded-card"
    >
      <div className="flex items-baseline justify-between gap-3 border-b border-line-subtle px-[18px] py-4 sm:px-6">
        <h2
          id="share-links-title"
          className="text-base font-extrabold sm:text-[17px]"
        >
          Tus links
        </h2>
        <span className="text-[13px] text-muted">
          {links.length === 1 ? "1 link" : `${links.length} links`}
        </span>
      </div>
      {links.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 px-6 py-14 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary-tint text-primary">
            <Link2 className="size-7" strokeWidth={1.8} aria-hidden />
          </span>
          <p className="text-[17px] font-extrabold">Todavía no creaste links</p>
          <p className="max-w-[340px] text-sm leading-normal text-muted">
            Creá el primero y pegalo en el grupo o la publicación donde
            compartas la tienda.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line-subtle">
          {links.map((link) => (
            <ShareLinkRow key={link.slug} link={link} siteUrl={siteUrl} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ShareLinkRow({ link, siteUrl }: { link: ShareLink; siteUrl: string }) {
  const notify = useToast();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const url = `${siteUrl}/de/${link.slug}`;
  const display = url.replace(/^https?:\/\//, "");
  const source =
    SHARE_SOURCES[link.source as ShareSource] ?? SHARE_SOURCES.otro;

  function remove() {
    startTransition(async () => {
      const result = await deleteShareLink(link.slug);
      if (result.ok) notify("Link eliminado");
      else {
        notify(result.error, "error");
        setConfirming(false);
      }
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-[18px] py-3.5 sm:px-6">
      <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
        <span className="truncate text-[15px] font-bold">{display}</span>
        <span className="text-[13px] text-muted">{source}</span>
      </div>
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-muted">
            ¿Eliminarlo?
          </span>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="flex h-11 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-bold"
          >
            No
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="flex h-11 items-center rounded-full bg-danger px-4 text-sm font-bold text-white disabled:opacity-70"
          >
            {pending ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              const copied = await copy(url);
              notify(
                copied ? "Link copiado" : "No se pudo copiar el link",
                copied ? undefined : "error",
              );
            }}
            className="flex h-11 items-center gap-2 rounded-full border border-line-strong bg-surface pr-4 pl-3.5 text-sm font-bold transition-colors hover:border-primary hover:text-primary"
          >
            <Copy className="size-4" strokeWidth={2} aria-hidden />
            Copiar
          </button>
          <button
            type="button"
            aria-label={`Eliminar ${display}`}
            title="Eliminar"
            onClick={() => setConfirming(true)}
            className="flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface text-muted transition-colors hover:border-danger-border hover:text-danger-strong"
          >
            <Trash2 className="size-[18px]" strokeWidth={1.9} aria-hidden />
          </button>
        </div>
      )}
    </li>
  );
}
