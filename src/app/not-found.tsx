import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import { MotionProvider } from "@/components/motion-provider";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import StoreNotFound from "./(store)/not-found";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

/** URLs that match no route: same 404, with the store header and footer. */
export default function NotFound() {
  return (
    <MotionProvider>
      <CartProvider>
        <SiteHeader />
        <main id="contenido" className="flex flex-1 flex-col">
          <StoreNotFound />
        </main>
        <SiteFooter />
      </CartProvider>
    </MotionProvider>
  );
}
