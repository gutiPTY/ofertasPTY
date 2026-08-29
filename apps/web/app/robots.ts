import type { MetadataRoute } from "next";

// Sin fetch dinámico adentro, Next.js pre-renderiza este archivo como
// estático en build time — si SITE_URL todavía no existía en ese momento,
// queda "congelado" con el valor por defecto para siempre, sin importar
// cuántos redeploys se hagan después. Se fuerza dinámico para leer la env
// var en cada request, igual que sitemap.ts.
export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Rutas privadas/autenticadas: no aportan nada indexadas y algunas
      // muestran datos por usuario.
      disallow: ["/admin", "/publicar", "/mis-ofertas", "/favoritos", "/comercio"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
