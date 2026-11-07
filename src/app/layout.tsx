import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { env } from "@/lib/env";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "Adriel Componentes",
    template: "%s · Adriel Componentes",
  },
  description:
    "Componentes de PC usados que tengo libres. Elegí lo que te sirva y consultame directo por WhatsApp.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={jakarta.variable}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
