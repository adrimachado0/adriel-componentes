import { ChipIcon } from "@/components/icons";

type LogoProps = {
  /** header: 34px → 38px mark; footer: 32px → 34px mark. */
  variant?: "header" | "footer";
  /** Hide "Componentes" on small screens (admin header). */
  compact?: boolean;
};

/** Blue chip mark + "Adriel Componentes" wordmark. Wrap it in a link where needed. */
export function Logo({ variant = "header", compact = false }: LogoProps) {
  const isHeader = variant === "header";
  return (
    <span className="flex items-center gap-2 text-ink sm:gap-2.5">
      <span
        className={
          isHeader
            ? "flex size-[34px] shrink-0 items-center justify-center rounded-[11px] bg-primary text-white shadow-logo sm:size-[38px] sm:rounded-xl"
            : "flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary text-white sm:size-[34px] sm:rounded-[11px]"
        }
      >
        <ChipIcon
          className={
            isHeader
              ? "size-[19px] sm:size-[21px]"
              : "size-[18px] sm:size-[19px]"
          }
        />
      </span>
      <span
        className={`flex items-baseline gap-1 tracking-[-0.02em] whitespace-nowrap sm:gap-[5px] ${
          isHeader ? "text-[17px] sm:text-[19px]" : "text-base sm:text-[17px]"
        }`}
      >
        <span className="font-extrabold">Adriel</span>
        <span
          className={`font-bold text-primary ${compact ? "hidden sm:inline" : ""}`}
        >
          Componentes
        </span>
      </span>
    </span>
  );
}
