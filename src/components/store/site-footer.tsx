import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import { cacheLife } from "next/cache";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
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
        <nav
          aria-label="Redes y contacto"
          className="flex flex-wrap gap-2 sm:gap-2.5"
        >
          <FooterLink
            href={contact.instagramUrl}
            external
            icon={<InstagramIcon className="size-[17px] sm:size-[18px]" />}
            iconClassName="bg-primary-tint text-primary"
          >
            Instagram
          </FooterLink>
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
        <p className="container-page py-4 text-[13px] text-muted sm:py-[18px]">
          © <CopyrightYear /> {SITE_NAME}
        </p>
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
      className="flex h-[46px] items-center gap-2 rounded-full border border-line-strong pr-4 pl-1.5 text-sm font-bold text-ink sm:h-12 sm:gap-2.5 sm:pr-[18px] sm:pl-[7px]"
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
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
