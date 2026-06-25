import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

function resolveSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  try {
    if (raw) return new URL(raw);
  } catch {
    /* valeur invalide : on retombe sur localhost */
  }
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: {
    default: "BnbMotion — Transformez vos photos en vidéo professionnelle",
    template: "%s · BnbMotion",
  },
  description:
    "Générez une vidéo promotionnelle cinématographique de votre logement à partir de vos photos, en quelques minutes. Sans vidéaste, sans matériel.",
  keywords: ["airbnb", "vidéo immobilière", "location courte durée", "host", "vidéo logement"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/icon.png", sizes: "512x512", type: "image/png" },
  },
  openGraph: {
    title: "BnbMotion — Transformez vos photos en vidéo professionnelle",
    description:
      "La vidéo qui donne envie de réserver votre logement. Générée par IA à partir de vos photos.",
    type: "website",
    locale: "fr_FR",
    images: [{ url: "/icon.png", width: 512, height: 512 }],
  },
  verification: { google: "cP9j8P23gzfMF1kEfdenhCmUGTsmIqRWnbNzXH8jYRs" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
