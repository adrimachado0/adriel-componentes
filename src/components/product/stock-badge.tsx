/**
 * Light pill over a product photo: "Última unidad" (stock 1) or "Vendido"
 * (stock 0). Renders nothing otherwise. Position it with `className`.
 */
export function StockBadge({
  stock,
  size = "sm",
  className = "",
}: {
  stock: number;
  /** "sm": cards. "lg": detail gallery. */
  size?: "sm" | "lg";
  className?: string;
}) {
  if (stock > 1) return null;
  const sold = stock < 1;
  const sizing =
    size === "lg"
      ? "h-7 px-3 text-[13px] sm:h-[30px] sm:text-sm"
      : "h-[22px] px-2 text-[11px] sm:h-6 sm:px-2.5 sm:text-xs";
  const tone = sold
    ? "bg-chip-dark text-white"
    : "bg-surface/90 text-primary shadow-card";
  return (
    <span
      className={`pointer-events-none absolute flex items-center rounded-full font-medium tracking-[0.01em] ${sizing} ${tone} ${className}`}
    >
      {sold ? "Vendido" : "Última unidad"}
    </span>
  );
}
