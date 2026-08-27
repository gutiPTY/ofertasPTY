"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdUnitProps {
  slot: string;
  format: string;
  layoutKey?: string;
  fullWidthResponsive?: boolean;
  className?: string;
}

// Empuja el anuncio al montar. AdSense no vuelve a inicializar el <ins> solo
// (a diferencia de una carga de página completa), así que cada instancia
// necesita su propio push tras montarse — importante en Next.js con
// navegación client-side entre ofertas.
export default function AdUnit({ slot, format, layoutKey, fullWidthResponsive, className }: AdUnitProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Bloqueador de anuncios, o el script de AdSense no cargó todavía.
    }
  }, []);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <ins
      className={`adsbygoogle block${className ? ` ${className}` : ""}`}
      style={{ display: "block" }}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-ad-layout-key={layoutKey}
      data-full-width-responsive={fullWidthResponsive ? "true" : undefined}
    />
  );
}
