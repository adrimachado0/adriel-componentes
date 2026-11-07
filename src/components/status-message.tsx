import type { ReactNode } from "react";

/** Centered icon + title + text + actions (404, errors). Same language as the empty states. */
export function StatusMessage({
  icon,
  tone = "primary",
  eyebrow,
  title,
  children,
  actions,
}: {
  icon: ReactNode;
  tone?: "primary" | "danger";
  eyebrow?: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="container-page flex flex-1 items-center justify-center py-16 sm:py-24">
      <div className="flex max-w-[440px] flex-col items-center gap-3 text-center">
        <span
          className={`flex size-16 items-center justify-center rounded-full ${
            tone === "danger"
              ? "bg-danger-bg text-danger-strong"
              : "bg-primary-tint text-primary"
          }`}
        >
          {icon}
        </span>
        {eyebrow ? (
          <span className="text-xs font-bold tracking-[0.08em] text-primary uppercase">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="text-[26px] leading-[1.15] font-extrabold tracking-[-0.025em] text-balance sm:text-[30px]">
          {title}
        </h1>
        <p className="text-[15px] leading-normal text-pretty text-muted">
          {children}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          {actions}
        </div>
      </div>
    </div>
  );
}

export const primaryActionClass =
  "flex h-12 items-center gap-2 rounded-full bg-primary px-[22px] text-[15px] font-bold text-white shadow-primary transition-colors hover:bg-primary-hover";

export const secondaryActionClass =
  "flex h-12 items-center gap-2 rounded-full border border-line-strong bg-surface px-[22px] text-[15px] font-bold transition-colors hover:border-primary";
