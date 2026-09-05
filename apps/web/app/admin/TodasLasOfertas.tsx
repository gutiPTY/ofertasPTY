import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ESTADO_BADGE, ESTADO_LABEL, type EstadoOferta } from "@/lib/ofertaEstado";
import { ocultarOferta, mostrarOferta } from "./actions";

interface OfertaTodas {
  id: string;
  titulo: string;
  imagenUrl: string;
  estado: EstadoOferta;
  oculta: boolean;
  categoria: { nombre: string };
  provincia: string;
  creadoPor: { nombre: string; email: string };
  creadoEn: string;
}

interface TodasResponse {
  ofertas: OfertaTodas[];
  total: number;
  page: number;
  pageSize: number;
}

// Server component async independiente (propio Suspense boundary desde
// page.tsx), igual que HistorialOfertas — a diferencia de esa, esta lista
// no filtra por estado: es el único lugar donde el admin ve TODO,
// incluidas las ofertas ocultas, para poder encontrar y gestionar
// cualquiera desde un solo lugar.
export default async function TodasLasOfertas({ page }: { page: number }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ofertas?page=${page}`, {
    headers: { Authorization: `Bearer ${session!.access_token}` },
    cache: "no-store",
  });
  const { ofertas, total, pageSize } = (await res.json()) as TodasResponse;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(nuevaPagina: number) {
    return `/admin?todasPage=${nuevaPagina}#todas`;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{total} ofertas en total, sin importar su estado.</p>

      {ofertas.length === 0 && <p className="text-sm text-muted">No hay ofertas todavía.</p>}

      <ul className="flex flex-col gap-3">
        {ofertas.map((oferta) => (
          <li
            key={oferta.id}
            className={`flex gap-3 rounded-2xl border p-3 ${
              oferta.oculta ? "border-dashed border-line bg-surface-2 opacity-70" : "border-line bg-surface"
            }`}
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
              <Image src={oferta.imagenUrl} alt={oferta.titulo} fill sizes="64px" className="object-contain" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-sm font-semibold text-ink">{oferta.titulo}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ESTADO_BADGE[oferta.estado]}`}>
                  {ESTADO_LABEL[oferta.estado]}
                </span>
                {oferta.oculta && (
                  <span className="rounded-full bg-critical-bg px-2 py-0.5 text-[11px] font-bold text-critical">
                    Oculta
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">
                {oferta.categoria.nombre} · {oferta.provincia} · publicada por {oferta.creadoPor.nombre} el{" "}
                {new Date(oferta.creadoEn).toLocaleDateString("es-PA")}
              </p>
            </div>
            <form action={oferta.oculta ? mostrarOferta.bind(null, oferta.id) : ocultarOferta.bind(null, oferta.id)}>
              <button
                type="submit"
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-bold transition ${
                  oferta.oculta
                    ? "border-line text-ink hover:border-ember hover:text-ember"
                    : "border-line text-critical hover:border-critical hover:bg-critical-bg"
                }`}
              >
                {oferta.oculta ? "Mostrar" : "Ocultar"}
              </button>
            </form>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={pageHref(page - 1)} scroll={false} className="rounded-full border border-line px-3 py-1.5">
              Anterior
            </Link>
          )}
          <span className="px-3 py-1.5 text-muted">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link href={pageHref(page + 1)} scroll={false} className="rounded-full border border-line px-3 py-1.5">
              Siguiente
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
