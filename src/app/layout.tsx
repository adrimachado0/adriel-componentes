import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SITE_NAME } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";
import { HOME_SHARE_IMAGE_PATH, SHARE_IMAGE } from "@/lib/share-image";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const DESCRIPTION =
  "Componentes de PC usados que tengo libres. Elegí lo que te sirva y consultame directo por WhatsApp.";

const homeShareImage = {
  url: HOME_SHARE_IMAGE_PATH,
  width: SHARE_IMAGE.width,
  height: SHARE_IMAGE.height,
  type: "image/jpeg",
  alt: "Adriel Componentes: componentes de PC usados",
};

export const metadata: Metadata = {
  // Absolute URLs for Open Graph: social crawlers can't resolve relative ones.
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: SITE_NAME,
    url: "/",
    title: `${SITE_NAME} · Componentes de PC usados`,
    description: DESCRIPTION,
    images: [homeShareImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · Componentes de PC usados`,
    description: DESCRIPTION,
    images: [homeShareImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={jakarta.variable} suppressHydrationWarning>
      <head>
        {/* Marks JS as available before paint, so <Reveal> can hide sections
            without ever leaving them invisible when JS is off. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
