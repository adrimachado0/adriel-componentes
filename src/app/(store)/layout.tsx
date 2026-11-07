import type { ReactNode } from "react";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { WhatsAppFab } from "@/components/store/whatsapp-fab";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
