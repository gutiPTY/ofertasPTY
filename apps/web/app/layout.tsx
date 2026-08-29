import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import Header from "@/components/Header";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        {children}
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
