import type { MetadataRoute } from "next";

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
