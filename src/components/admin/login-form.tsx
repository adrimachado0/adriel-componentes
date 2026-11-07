"use client";

import { useActionState, useState } from "react";
import {
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
} from "lucide-react";
import { signIn, type SignInState } from "@/lib/actions/auth";

const initialState: SignInState = { error: null, email: "" };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const hasError = Boolean(state.error) && !pending;
  const inputBorder = hasError ? "border-danger-input" : "border-line-strong";

  return (
    <form
      action={formAction}
      className="mx-auto flex w-full max-w-[400px] flex-col gap-[18px]"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.025em] sm:text-[30px]">
          Iniciar sesión
        </h1>
        <p className="text-[15px] leading-normal text-muted">
          Ingresá con tu cuenta de administrador.
        </p>
      </div>

      {hasError ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-field border border-danger-border bg-danger-bg px-4 py-3.5 text-danger-text"
        >
          <CircleAlert
            className="mt-px size-5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold">No se pudo iniciar sesión</span>
            <span className="text-[13px] leading-[1.45]">
              {state.error} Revisalos e intentá de nuevo.
            </span>
          </div>
        </div>
      ) : null}

      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-2">
        <label htmlFor="login-email" className="text-sm font-bold">
          Email
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-4 size-[19px] -translate-y-1/2 text-muted"
            strokeWidth={1.8}
            aria-hidden
          />
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="username"
            inputMode="email"
            spellCheck={false}
            autoCapitalize="none"
            placeholder="tu@email.com"
            defaultValue={state.email}
            aria-invalid={hasError || undefined}
            className={`h-[52px] w-full rounded-field border-[1.5px] bg-field pr-4 pl-[46px] text-base outline-none focus:border-primary sm:text-[15px] ${inputBorder}`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="login-password" className="text-sm font-bold">
          Contraseña
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-4 size-[19px] -translate-y-1/2 text-muted"
            strokeWidth={1.8}
            aria-hidden
          />
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Tu contraseña"
            aria-invalid={hasError || undefined}
            className={`h-[52px] w-full rounded-field border-[1.5px] bg-field pr-[52px] pl-[46px] text-base outline-none focus:border-primary sm:text-[15px] ${inputBorder}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            aria-pressed={showPassword}
            className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-[11px] text-muted"
          >
            {showPassword ? (
              <EyeOff className="size-5" strokeWidth={1.8} aria-hidden />
            ) : (
              <Eye className="size-5" strokeWidth={1.8} aria-hidden />
            )}
          </button>
        </div>
      </div>

      <label
        htmlFor="login-remember"
        className="flex min-h-11 cursor-pointer items-center gap-2.5 self-start"
      >
        <input
          id="login-remember"
          name="remember"
          type="checkbox"
          defaultChecked
          className="size-[18px] accent-primary"
        />
        <span className="text-sm font-medium">Mantener la sesión iniciada</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex h-[54px] items-center justify-center gap-2.5 rounded-full bg-primary text-[15px] font-bold text-white shadow-primary transition-colors hover:bg-primary-hover disabled:opacity-80"
      >
        {pending ? (
          <>
            <LoaderCircle
              className="size-[18px] animate-spin"
              strokeWidth={2.4}
              aria-hidden
            />
            Ingresando…
          </>
        ) : (
          <>
            Ingresar
            <ArrowRight className="size-[18px]" strokeWidth={2} aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}
