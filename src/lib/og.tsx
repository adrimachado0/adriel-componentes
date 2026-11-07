import "server-only";
import { ImageResponse } from "next/og";
import sharp from "sharp";

// Open Graph images are shared on WhatsApp and social networks, whose crawlers don't
// reliably support WebP, so everything is emitted as JPEG.
// Colors are literal here: Satori/sharp can't read the CSS tokens. They mirror
// --color-page, --color-hero-*, --color-primary and --color-hero-text.
const PAGE_BG = "#f3f6fc";
const HERO = "linear-gradient(115deg, #060e24 0%, #0b1b4b 55%, #102c78 100%)";
const PRIMARY = "#1f5bef";
const HERO_TEXT = "#c9d5f5";

export const OG_SIZE = { width: 1200, height: 630 } as const;

/**
 * Custom share image (made for 1200×630): fills the frame, cropping from the
 * center if its proportions differ, as JPEG.
 */
export async function shareImageToOgJpeg(
  image: ArrayBuffer,
): Promise<Uint8Array> {
  const jpeg = await sharp(Buffer.from(image))
    .resize(OG_SIZE.width, OG_SIZE.height, { fit: "cover", position: "centre" })
    .flatten({ background: PAGE_BG })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  return new Uint8Array(jpeg);
}

/** Product photo letterboxed on the page background, as JPEG. */
export async function photoToOgJpeg(photo: ArrayBuffer): Promise<Uint8Array> {
  const jpeg = await sharp(Buffer.from(photo))
    .resize(OG_SIZE.width, OG_SIZE.height, {
      fit: "contain",
      background: PAGE_BG,
    })
    .flatten({ background: PAGE_BG })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Uint8Array(jpeg);
}

/** Branded card (no photo): logo, optional title and price, as JPEG. */
export async function brandCardJpeg({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}): Promise<Uint8Array> {
  const png = await new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: HERO,
        color: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: PRIMARY,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
            <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
            <path d="M9 2.5v3M15 2.5v3M9 18.5v3M15 18.5v3M2.5 9h3M2.5 15h3M18.5 9h3M18.5 15h3" />
          </svg>
        </div>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
          Adriel&nbsp;
          <span style={{ color: HERO_TEXT, fontWeight: 700 }}>Componentes</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: title.length > 40 ? 60 : 72,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 36, color: HERO_TEXT }}>{subtitle}</div>
        ) : null}
      </div>
    </div>,
    OG_SIZE,
  ).arrayBuffer();

  const jpeg = await sharp(Buffer.from(png)).jpeg({ quality: 88 }).toBuffer();
  return new Uint8Array(jpeg);
}
