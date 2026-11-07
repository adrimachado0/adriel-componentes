import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";
import { CopyrightYear } from "@/components/store/site-footer";
import { SITE_NAME } from "@/lib/site";
import { safeAdminPath } from "@/lib/validation/auth";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="container-page flex h-[60px] items-center justify-between gap-4 sm:h-[72px]">
        <Link
          href="/"
          aria-label="Adriel Componentes, volver al inicio"
          className="rounded-xl"
        >
          <Logo compact />
        </Link>
        <Link
          href="/"
          className="flex h-11 items-center gap-2 rounded-full border border-line-strong bg-surface pr-4 pl-3 text-sm font-bold whitespace-nowrap"
        >
          <ArrowLeft className="size-[18px]" strokeWidth={2} aria-hidden />
          Volver a la tienda
        </Link>
      </header>

      <main className="container-page flex flex-1 items-center justify-center pt-4 pb-14 sm:pt-6">
        <div className="flex w-full max-w-[980px] flex-wrap overflow-hidden rounded-hero border border-line bg-surface shadow-login">
          <section
            aria-label="Panel de administración"
            className="flex flex-[1_1_360px] flex-col justify-between gap-7 px-6 py-7 text-white bg-hero sm:px-[clamp(24px,4vw,40px)] sm:py-9"
          >
            <span className="flex h-[30px] items-center gap-2 self-start rounded-full border border-white/16 bg-white/8 px-3 text-xs font-bold tracking-[0.08em] text-hero-badge uppercase">
              <Lock className="size-3.5" strokeWidth={2} aria-hidden />
              Panel de administración
            </span>
            <LoginArt />
            <div className="flex flex-col gap-2.5">
              <h2 className="text-[22px] leading-[1.15] font-extrabold tracking-[-0.02em] sm:text-[26px]">
                Gestioná tus publicaciones
              </h2>
              <p className="max-w-[340px] text-[15px] leading-[1.55] text-hero-text">
                Cargá componentes con fotos, precio y stock, y mantené la tienda
                al día.
              </p>
            </div>
          </section>

          <section className="flex flex-[1_1_360px] items-center px-6 py-8 sm:px-[clamp(24px,5vw,56px)] sm:py-[clamp(32px,5vw,56px)]">
            <Suspense fallback={<LoginForm next="/admin" />}>
              <LoginFormWithNext searchParams={searchParams} />
            </Suspense>
          </section>
        </div>
      </main>

      <footer className="container-page pb-7 text-center">
        <p className="text-[13px] text-muted">
          © <CopyrightYear /> {SITE_NAME}
        </p>
      </footer>
    </div>
  );
}

async function LoginFormWithNext({
  searchParams,
}: Pick<PageProps<"/admin/login">, "searchParams">) {
  const { next } = await searchParams;
  return <LoginForm next={safeAdminPath(next)} />;
}

/** Chip with a padlock (≥ 760px). */
function LoginArt() {
  return (
    <svg
      width="300"
      height="200"
      viewBox="20 20 320 200"
      fill="none"
      aria-hidden
      className="hidden h-auto max-w-full self-center text-white min-[760px]:block"
    >
      <g
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M250 80h30l14-14h30" />
        <path d="M250 100h56l8 8h20" />
        <path d="M250 140h44l12 12h24" />
        <path d="M250 160h22l18 18h34" />
        <path d="M110 80H80L66 66H36" />
        <path d="M110 100H54l-8 8H26" />
        <path d="M110 140H66l-12 12H30" />
        <path d="M110 160H88l-18 18H36" />
        <path d="M160 50V36l-10-10" />
        <path d="M200 50V28" />
        <path d="M160 190v14l-10 10" />
        <path d="M200 190v22" />
      </g>
      <g fill="currentColor" fillOpacity="0.5">
        <circle cx="324" cy="66" r="3.5" />
        <circle cx="334" cy="108" r="3.5" />
        <circle cx="330" cy="152" r="3.5" />
        <circle cx="324" cy="178" r="3.5" />
        <circle cx="36" cy="66" r="3.5" />
        <circle cx="26" cy="108" r="3.5" />
        <circle cx="30" cy="152" r="3.5" />
        <circle cx="36" cy="178" r="3.5" />
        <circle cx="150" cy="26" r="3.5" />
        <circle cx="200" cy="28" r="3.5" />
        <circle cx="150" cy="214" r="3.5" />
        <circle cx="200" cy="212" r="3.5" />
      </g>
      <path
        d="M140 50v8M160 50v8M180 50v8M200 50v8M220 50v8M140 182v8M160 182v8M180 182v8M200 182v8M220 182v8M110 80h8M110 100h8M110 120h8M110 140h8M110 160h8M242 80h8M242 100h8M242 120h8M242 140h8M242 160h8"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect
        x="120"
        y="60"
        width="120"
        height="120"
        rx="22"
        fill="currentColor"
        fillOpacity="0.07"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      <rect
        x="148"
        y="88"
        width="64"
        height="64"
        rx="14"
        className="fill-hero-chip"
        fillOpacity="0.35"
        stroke="currentColor"
        strokeOpacity="0.75"
        strokeWidth="1.5"
      />
      <path
        d="M170 117v-7a10 10 0 0 1 20 0v7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect
        x="164"
        y="117"
        width="32"
        height="22"
        rx="5"
        fill="currentColor"
        fillOpacity="0.95"
      />
      <circle cx="180" cy="127" r="2.6" className="fill-hero-via" />
      <path
        d="M180 129v4"
        className="stroke-hero-via"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
