import Link from "next/link";
import { User } from "lucide-react";
import { Logo } from "@/components/logo";
import { CartButton } from "@/components/cart/cart-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/94 sm:bg-surface/90 sm:backdrop-blur-md sm:backdrop-saturate-[1.4]">
      <div className="container-page flex h-[60px] items-center justify-between gap-3 sm:h-[72px] sm:gap-4">
        <Link
          href="/"
          aria-label="Adriel Componentes, inicio"
          className="rounded-xl"
        >
          <Logo />
        </Link>
        <div className="flex items-center gap-2 sm:gap-2.5">
          <CartButton />
          <Link
            href="/admin"
            aria-label="Iniciar sesión"
            className="flex size-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface text-sm font-bold text-ink transition-colors hover:border-primary hover:text-primary sm:w-auto sm:px-4"
          >
            <User className="size-[19px]" strokeWidth={1.8} aria-hidden />
            <span className="hidden sm:inline">Iniciar sesión</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
