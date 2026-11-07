import Link from "next/link";
import { Logo } from "@/components/logo";
import { CartButton } from "@/components/cart/cart-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/94 sm:bg-surface/90 sm:backdrop-blur-md sm:backdrop-saturate-[1.4]">
      <div className="container-page flex h-[60px] items-center justify-between gap-3 sm:h-[72px] sm:gap-4">
        <Link
          href="/"
          prefetch={true}
          aria-label="Adriel Componentes, inicio"
          className="rounded-xl"
        >
          <Logo />
        </Link>
        <CartButton />
      </div>
    </header>
  );
}
