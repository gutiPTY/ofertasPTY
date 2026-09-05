import type { Metadata } from "next";
import Script from "next/script";
import { Fredoka, Manrope } from "next/font/google";
import Header from "@/components/Header";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
const titulo = "Encuentra Ofertas PTY";
const descripcion = "Ofertas de comercios en Panamá, moderadas por la comunidad.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: titulo, template: `%s — ${titulo}` },
  description: descripcion,
  openGraph: {
    type: "website",
    locale: "es_PA",
    siteName: titulo,
    title: titulo,
    description: descripcion,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: titulo,
    description: descripcion,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="es">
      <body
        className={`${fredoka.variable} ${manrope.variable} bg-paper font-sans text-ink antialiased`}
      >
        <ToastProvider>
          <Header />
          {children}
        </ToastProvider>
      </body>
      {adsenseClientId && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}
    </html>
  );
}
