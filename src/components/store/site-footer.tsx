import type { ReactNode } from "react";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { cacheLife } from "next/cache";
import { WhatsAppIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { contact, SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page flex flex-col gap-4 pt-7 pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6 sm:py-9">
        <div className="flex max-w-[360px] flex-col gap-4 sm:gap-2.5">
          <Logo variant="footer" />
          <p className="text-sm leading-[1.55] text-muted">
            Componentes de PC que tengo libres. Consultas y coordinación por
            WhatsApp.
          </p>
        </div>
        <nav aria-label="Contacto" className="flex flex-wrap gap-2 sm:gap-2.5">
          <FooterLink
            href={contact.whatsappGeneralUrl}
            external
            icon={<WhatsAppIcon className="size-[17px] sm:size-[18px]" />}
            iconClassName="bg-whatsapp-tint text-whatsapp"
          >
            WhatsApp
          </FooterLink>
          <FooterLink
            href={`mailto:${contact.email}`}
            icon={
              <Mail
                className="size-[17px] sm:size-[18px]"
                strokeWidth={1.8}
                aria-hidden
              />
            }
            iconClassName="bg-primary-tint text-primary"
          >
            Email
          </FooterLink>
        </nav>
      </div>
      <div className="border-t border-line-subtle">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-[13px] text-muted sm:py-1.5">
          <p>
            © <CopyrightYear /> {SITE_NAME}
          </p>
          {/* Discreet on purpose: the panel is only for the store owner. */}
          <Link
            href="/admin"
            prefetch={false}
            className="-mx-2 flex min-h-11 items-center gap-1.5 rounded-full px-2 font-semibold transition-colors hover:text-ink"
          >
            <Lock className="size-3.5" strokeWidth={2} aria-hidden />
            Acceso administradores
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  external = false,
  icon,
  iconClassName,
  children,
}: {
  href: string;
  external?: boolean;
  icon: ReactNode;
  iconClassName: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex h-[46px] items-center gap-2 rounded-full border border-line-strong pr-4 pl-1.5 text-sm font-bold text-ink transition-colors hover:border-primary sm:h-12 sm:gap-2.5 sm:pr-[18px] sm:pl-[7px]"
    >
      <span
        className={`flex size-[34px] items-center justify-center rounded-full ${iconClassName}`}
      >
        {icon}
      </span>
      <span>{children}</span>
    </a>
  );
}

/** Cached so the year can be part of the static shell. */
export async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
