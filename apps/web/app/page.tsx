import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HeroCarousel from "@/components/HeroCarousel";
import RegisterStrip from "@/components/RegisterStrip";
import CategoriasSection from "@/components/CategoriasSection";
import SidebarFiltros from "@/components/SidebarFiltros";
import OfertaCard from "@/components/OfertaCard";
import AdUnit from "@/components/AdUnit";

interface Categoria {
  id: string;
  nombre: string;
}

interface OfertaFeed {
  id: string;
  slug: string;
  titulo: string;
  imagenUrl: string;
  provincia: string;
  precioOferta: string | null;
  precioOriginal: string | null;
  categoria: { nombre: string };
}

interface SearchParams {
  categoriaId?: string;
  provincia?: string;
  q?: string;
  precioMin?: string;
  precioMax?: string;
  page?: string;
}

export default async function Home({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await searchParamsPromise;
  const params = new URLSearchParams();
  if (searchParams.categoriaId) params.set("categoriaId", searchParams.categoriaId);
  if (searchParams.provincia) params.set("provincia", searchParams.provincia);
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.precioMin) params.set("precioMin", searchParams.precioMin);
  if (searchParams.precioMax) params.set("precioMax", searchParams.precioMax);
  if (searchParams.page) params.set("page", searchParams.page);

  // El carrusel y la sección de categorías solo aparecen en la home
  // "limpia" (sin filtros ni paginación) — en una vista filtrada no
  // aportan y compiten con los resultados.
  const esHomeLimpia = params.size === 0;

  const supabase = await createClient();

  const [feedRes, categoriasRes, destacadasRes, sessionResult] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/ofertas?${params.toString()}`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categorias`, { cache: "no-store" }),
    esHomeLimpia
      ? fetch(`${process.env.NEXT_PUBLIC_API_URL}/ofertas/destacadas`, { cache: "no-store" })
      : Promise.resolve(null),
    supabase.auth.getSession(),
  ]);

  const { ofertas, total, page, pageSize } = (await feedRes.json()) as {
    ofertas: OfertaFeed[];
    total: number;
    page: number;
    pageSize: number;
  };
  const { categorias } = (await categoriasRes.json()) as { categorias: Categoria[] };
  const destacadas = destacadasRes
    ? ((await destacadasRes.json()) as { ofertas: OfertaFeed[] }).ofertas
    : [];
  const haySesion = Boolean(sessionResult.data.session);

  // Épica 5/8: el carrusel muestra ofertas destacadas de comercios con
  // plan pago; si no hay ninguna, cae a las últimas ofertas agregadas
  // (el feed ya viene ordenado destacada desc, creadoEn desc).
  const slidesCarrusel = (destacadas.length > 0 ? destacadas : ofertas).slice(0, 3);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(nextPage: number) {
    const p = new URLSearchParams(params);
    p.set("page", String(nextPage));
    return `/?${p.toString()}`;
  }

  return (
    <main className="flex flex-col pb-16">
      {esHomeLimpia && (
        <>
          <HeroCarousel slides={slidesCarrusel} />
          {!haySesion && <RegisterStrip />}
        </>
      )}

      <CategoriasSection categorias={categorias} categoriaActivaId={searchParams.categoriaId} />

      <div className="mx-auto mt-10 grid w-full max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-[220px_1fr]">
        <SidebarFiltros categorias={categorias} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Todas las ofertas <span className="text-base font-semibold text-muted">({total})</span>
            </h2>
          </div>

          {ofertas.length === 0 && (
            <p className="py-12 text-center text-muted">No hay ofertas que coincidan con la búsqueda.</p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {ofertas.map((oferta) => (
              <OfertaCard key={oferta.id} {...oferta} />
            ))}
          </div>

          {/* Fuera de la grilla a propósito: si AdSense no tiene relleno
              para mostrar, el hueco queda en su propia franja en vez de
              romper la simetría de las tarjetas de ofertas. */}
          {ofertas.length > 4 && (
            <AdUnit slot="4882093875" format="fluid" layoutKey="-fb+5w+4e-db+86" />
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4 text-sm">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className="rounded-full border border-line px-3 py-1.5">
                  Anterior
                </Link>
              )}
              <span className="px-3 py-1.5 text-muted">
                Página {page} de {totalPages}
              </span>
              {page < totalPages && (
                <Link href={pageHref(page + 1)} className="rounded-full border border-line px-3 py-1.5">
                  Siguiente
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
