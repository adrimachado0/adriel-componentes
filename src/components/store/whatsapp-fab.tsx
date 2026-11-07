import { WhatsAppIcon } from "@/components/icons";
import { whatsappEvent } from "@/lib/analytics";
import { contact } from "@/lib/site";

/** Floating WhatsApp button on public pages. */
export function WhatsAppFab() {
  return (
    <a
      href={contact.whatsappGeneralUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      data-whatsapp-fab
      {...whatsappEvent("boton-flotante")}
      className="fixed right-4 bottom-[calc(16px+var(--bottom-bar-h))] z-40 flex size-14 items-center justify-center rounded-full bg-whatsapp-fab text-white shadow-fab sm:right-6 sm:bottom-6 sm:size-[60px]"
    >
      <WhatsAppIcon className="size-[26px] sm:size-7" strokeWidth={1.7} />
    </a>
  );
}
