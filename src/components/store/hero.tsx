import { getStoreProducts } from "@/lib/data/products";

export async function Hero() {
  const products = await getStoreProducts();
  const count = products.length;
  const countLabel =
    count === 1
      ? "1 componente disponible"
      : `${count} componentes disponibles`;

  return (
    <div className="container-page pt-4 sm:pt-6">
      <section
        aria-label="Presentación"
        className="relative flex flex-col gap-2.5 overflow-hidden rounded-hero-sm px-[22px] pt-6 pb-[26px] text-white bg-hero sm:min-h-[220px] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-hero sm:px-[clamp(24px,5vw,56px)] sm:py-9"
      >
        <MobileChipArt />
        <div className="relative flex max-w-[540px] flex-col gap-2.5 sm:gap-3">
          <span className="flex h-7 items-center gap-[7px] self-start rounded-full border border-white/16 bg-white/8 px-[11px] text-[11px] font-bold tracking-[0.08em] text-hero-badge uppercase sm:h-[30px] sm:gap-2 sm:px-3 sm:text-xs">
            <span className="size-1.5 rounded-full bg-live shadow-live sm:size-[7px]" />
            <span>{countLabel}</span>
          </span>
          <h1 className="mt-0.5 text-[30px] leading-[1.05] font-extrabold tracking-[-0.03em] sm:mt-0 sm:text-[clamp(32px,4.4vw,46px)] sm:leading-[1.04]">
            Componentes de PC
          </h1>
          <p className="max-w-[440px] text-[15px] leading-normal text-pretty text-hero-text sm:text-base sm:leading-[1.55]">
            Hardware que tengo libre para vender. Elegí lo que te sirva y
            consultame directo por WhatsApp.
          </p>
        </div>
        <CircuitArt />
      </section>
    </div>
  );
}

/** Small chip in the top-right corner (mobile only). */
function MobileChipArt() {
  return (
    <svg
      width="150"
      height="150"
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden
      className="absolute -top-[30px] -right-[34px] text-white opacity-55 sm:hidden"
    >
      <path
        d="M42 28v8M54 28v8M66 28v8M78 28v8M42 84v8M54 84v8M66 84v8M78 84v8M28 42h8M28 54h8M28 66h8M28 78h8M84 42h8M84 54h8M84 66h8M84 78h8"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="36"
        y="36"
        width="48"
        height="48"
        rx="10"
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      <rect
        x="48"
        y="48"
        width="24"
        height="24"
        rx="6"
        className="fill-hero-chip"
        fillOpacity="0.4"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** Chip with circuit traces (≥ 760px). */
function CircuitArt() {
  return (
    <svg
      width="360"
      height="200"
      viewBox="0 20 360 200"
      fill="none"
      aria-hidden
      className="relative hidden shrink-0 text-white min-[760px]:block"
    >
      <g
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M250 80h30l14-14h40" />
        <path d="M250 100h56l8 8h30" />
        <path d="M250 140h44l12 12h34" />
        <path d="M250 160h22l18 18h44" />
        <path d="M110 80H80L66 66H26" />
        <path d="M110 100H54l-8 8H16" />
        <path d="M110 140H66l-12 12H20" />
        <path d="M110 160H88l-18 18H26" />
        <path d="M160 50V36l-10-10" />
        <path d="M200 50V28" />
        <path d="M160 190v14l-10 10" />
        <path d="M200 190v22" />
      </g>
      <g fill="currentColor" fillOpacity="0.5">
        <circle cx="334" cy="66" r="3.5" />
        <circle cx="344" cy="108" r="3.5" />
        <circle cx="340" cy="152" r="3.5" />
        <circle cx="334" cy="178" r="3.5" />
        <circle cx="26" cy="66" r="3.5" />
        <circle cx="16" cy="108" r="3.5" />
        <circle cx="20" cy="152" r="3.5" />
        <circle cx="26" cy="178" r="3.5" />
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
        d="M166 108h28M166 120h28M166 132h18"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
