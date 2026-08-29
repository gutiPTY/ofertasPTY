import type { MetadataRoute } from "next";

interface OfertaSitemap {
  slug: string;
  actualizadoEn: string;
}

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

// Trae todas las ofertas publicadas paginando el feed público (Épica 8:
// "sitemap dinámico que incluya todas las ofertas publicadas").
async function getTodasLasOfertasPublicadas(): Promise<OfertaSitemap[]> {
  const ofertas: OfertaSitemap[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ofertas?page=${page}`, {
      cache: "no-store",
    });
    if (!res.ok) break;

    const data = await res.json();
    ofertas.push(...data.ofertas);

    if (page * data.pageSize >= data.total) break;
    page += 1;
  }

  return ofertas;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ofertas = await getTodasLasOfertasPublicadas().catch(() => []);

  return [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    ...ofertas.map((oferta) => ({
      url: `${SITE_URL}/ofertas/${oferta.slug}`,
      lastModified: oferta.actualizadoEn,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
