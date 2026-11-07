import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import {
  primaryActionClass,
  secondaryActionClass,
  StatusMessage,
} from "@/components/status-message";
import { contact } from "@/lib/site";

/** 404 inside the store (unknown product, notFound()). */
export default function StoreNotFound() {
  return (
    <StatusMessage
      eyebrow="Error 404"
      icon={<PackageSearch className="size-7" strokeWidth={1.8} aria-hidden />}
      title="No encontramos esta página"
      actions={
        <>
          <Link href="/" className={primaryActionClass}>
            Ver componentes
          </Link>
          <a
            href={contact.whatsappGeneralUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryActionClass}
          >
            <WhatsAppIcon className="size-[18px] text-whatsapp" />
            Consultar por WhatsApp
          </a>
        </>
      }
    >
      Puede que el componente ya se haya vendido o que el link esté mal. Mirá lo
      que está disponible o escribime.
    </StatusMessage>
  );
}
