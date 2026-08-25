import Link from "next/link";
import FiltrosFeed from "@/components/FiltrosFeed";
import OfertaCard from "@/components/OfertaCard";

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
  page?: string;
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = new URLSearchParams();
  if (searchParams.categoriaId) params.set("categoriaId", searchParams.categoriaId);
  if (searchParams.provincia) params.set("provincia", searchParams.provincia);
  if (searchParams.q) params.set("q", searchParams.q);
  if (searchParams.page) params.set("page", searchParams.page);

  const [feedRes, categoriasRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/ofertas?${params.toString()}`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categorias`, { cache: "no-store" }),
  ]);

  const { ofertas, total, page, pageSize } = (await feedRes.json()) as {
    ofertas: OfertaFeed[];
    total: number;
    page: number;
    pageSize: number;
  };
  const { categorias } = await categoriasRes.json();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(nextPage: number) {
    const p = new URLSearchParams(params);
    p.set("page", String(nextPage));
    return `/?${p.toString()}`;
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <FiltrosFeed categorias={categorias} />

      {ofertas.length === 0 && (
        <p className="py-12 text-center text-neutral-500">No hay ofertas que coincidan con la búsqueda.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {ofertas.map((oferta) => (
          <OfertaCard key={oferta.id} {...oferta} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4 text-sm">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="rounded border px-3 py-1.5">
              Anterior
            </Link>
          )}
          <span className="px-3 py-1.5 text-neutral-500">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link href={pageHref(page + 1)} className="rounded border px-3 py-1.5">
              Siguiente
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
