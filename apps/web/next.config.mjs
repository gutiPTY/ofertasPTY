const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

// Sin nonces a propósito: la doc de Next 16 (content-security-policy.md)
// exige "dynamic rendering" en TODAS las páginas para usar nonces (Next los
// inyecta leyendo el header en el momento del render), lo que anularía el
// trabajo de ISR/cache del punto 1 del audit de Lighthouse y forzaría
// SSR completo en páginas hoy estáticas (contacto, privacidad, etc.). Con
// 'unsafe-inline' en script-src perdemos parte de la protección XSS de una
// CSP estricta, pero evitamos ese costo y el riesgo real de romper el
// script de AdSense (inyecta sub-scripts dinámicamente; strict-dynamic con
// AdSense no está garantizado y no hay forma de probarlo sin arriesgar la
// cuenta real). Ver next.config.mjs de esta app para el detalle de orígenes.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagservices.com https://www.google.com https://www.gstatic.com https://*.adtrafficquality.google https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseUrl} https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.google.com https://www.gstatic.com https://tpc.googlesyndication.com https://*.adtrafficquality.google`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseUrl} ${apiUrl} https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.adtrafficquality.google https://cloudflareinsights.com`,
  "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://pagead2.googlesyndication.com https://*.adtrafficquality.google",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ofertaspty/shared-types", "@ofertaspty/ui"],
  images: {
    remotePatterns: [
      // Imágenes de ofertas suben a Supabase Storage (bucket público "ofertas").
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/**" },
    ],
    // Next 16 exige declarar los valores de quality permitidos (default
    // solo [75] — un quality={60} en un componente se ignoraba en
    // silencio sin esto). 60 para miniaturas de grilla (OfertaCard,
    // Favoritos, Mis Ofertas); 75 se mantiene para el resto.
    qualities: [60, 75],
  },
  // Lighthouse (severidad Alta, peso 0 en el score): sin CSP, sin COOP, sin
  // X-Frame-Options/frame-ancestors, HSTS sin includeSubDomains/preload.
  // No incluye Trusted Types a propósito — ver nota abajo.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Fallback para navegadores/herramientas que solo miran esta
          // cabecera (frame-ancestors en la CSP ya cubre clickjacking en
          // los navegadores modernos).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // includeSubDomains + preload: agregar el header es necesario
          // pero no suficiente para el preload real — falta el paso manual
          // de enviar el dominio en https://hstspreload.org/ una vez
          // desplegado (Google/Chromium lo revisan antes de sumarlo a la
          // lista embebida en el navegador).
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
