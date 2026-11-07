import Link from "next/link";
import { Suspense } from "react";
import { Link2, LogOut, SquareArrowOutUpRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { signOut } from "@/lib/actions/auth";
import { getAdminSession } from "@/lib/auth";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/94 sm:bg-surface/92 sm:backdrop-blur-md sm:backdrop-saturate-[1.4]">
      <div className="container-page flex h-[60px] items-center justify-between gap-3 sm:h-[72px]">
        <Link
          href="/admin"
          aria-label="Panel de Adriel Componentes"
          className="flex min-w-0 items-center gap-2 rounded-xl sm:gap-3"
        >
          <Logo compact />
          <span className="flex h-6 items-center rounded-full bg-ink px-[9px] text-[11px] font-bold tracking-[0.04em] text-white sm:h-[26px] sm:px-2.5 sm:text-xs">
            Panel
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/links"
            aria-label="Links para compartir"
            className="flex size-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface text-sm font-bold whitespace-nowrap transition-colors hover:border-primary hover:text-primary sm:w-auto sm:pr-4 sm:pl-3.5"
          >
            <Link2 className="size-[18px]" strokeWidth={1.9} aria-hidden />
            <span className="hidden sm:inline">Links</span>
          </Link>
          <Link
            href="/"
            aria-label="Ver tienda"
            className="flex size-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface text-sm font-bold whitespace-nowrap transition-colors hover:border-primary hover:text-primary sm:w-auto sm:pr-4 sm:pl-3.5"
          >
            <SquareArrowOutUpRight
              className="size-[18px]"
              strokeWidth={1.9}
              aria-hidden
            />
            <span className="hidden sm:inline">Ver tienda</span>
          </Link>
          <Suspense
            fallback={<span className="size-10 skeleton rounded-full" />}
          >
            <AdminAvatar />
          </Suspense>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:text-danger-strong"
            >
              <LogOut className="size-[18px]" strokeWidth={1.9} aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

async function AdminAvatar() {
  const session = await getAdminSession();
  const initial = (session?.email.trim()[0] ?? "A").toUpperCase();
  return (
    <span
      title={session?.email}
      className="flex size-10 items-center justify-center rounded-full bg-primary-tint-strong text-[15px] font-extrabold text-primary"
    >
      <span aria-hidden>{initial}</span>
      <span className="sr-only">Sesión de {session?.email}</span>
    </span>
  );
}
