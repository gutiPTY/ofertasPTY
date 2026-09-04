import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ESTADO_BADGE, ESTADO_LABEL, type EstadoOferta } from "@/lib/ofertaEstado";

type EstadoHistorial = "PUBLICADA" | "RECHAZADA" | "EXPIRADA";
const TABS: EstadoHistorial[] = ["PUBLICADA", "RECHAZADA", "EXPIRADA"];

interface OfertaHistorial {
  id: string;
  titulo: string;
  imagenUrl: string;
  estado: EstadoOferta;
  categoria: { nombre: string };
  provincia: string;
  creadoPor: { nombre: string; email: string };
  moderaciones: { motivo: string | null; fecha: string; moderador: { nombre: string } }[];
  ediciones: { fecha: string; admin: { nombre: string } }[];
}

interface HistorialResponse {
  ofertas: OfertaHistorial[];
  total: number;
  page: number;
  pageSize: number;
}

// Server component async independiente (propio Suspense boundary desde
// page.tsx) — el join con Moderacion/OfertaEdicion es más pesado que las
// colas de moderación, así que no debe bloquear el render de esas.
export default async function HistorialOfertas({
  estado,
  page,
}: {
  estado: EstadoHistorial;
  page: number;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/ofertas/historial?estado=${estado}&page=${page}`,
    {
      headers: { Authorization: `Bearer ${session!.access_token}` },
      cache: "no-store",
    },
  );
  const { ofertas, total, pageSize } = (await res.json()) as HistorialResponse;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function tabHref(tabEstado: EstadoHistorial) {
    return `/admin?historialEstado=${tabEstado}`;
  }

  function pageHref(nuevaPagina: number) {
    return `/admin?historialEstado=${estado}&historialPage=${nuevaPagina}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={tabHref(tab)}
            scroll={false}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              tab === estado
                ? "border-ember bg-ember text-ember-ink"
                : "border-line text-ink hover:border-ember hover:text-ember"
            }`}
          >
            {ESTADO_LABEL[tab]} ({tab === estado ? total : "…"})
          </Link>
        ))}
      </div>

      {ofertas.length === 0 && (
        <p className="text-sm text-muted">No hay ofertas {ESTADO_LABEL[estado].toLowerCase()}s todavía.</p>
      )}

      <ul className="flex flex-col gap-3">
        {ofertas.map((oferta) => {
          const ultimaModeracion = oferta.moderaciones[0];
          const ultimaEdicion = oferta.ediciones[0];
          return (
            <li key={oferta.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                <Image
                  src={oferta.imagenUrl}
                  alt={oferta.titulo}
                  fill
                  sizes="64px"
                  className="object-cover object-top"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-semibold text-ink">{oferta.titulo}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ESTADO_BADGE[oferta.estado]}`}>
                    {ESTADO_LABEL[oferta.estado]}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {oferta.categoria.nombre} · {oferta.provincia} · publicada por {oferta.creadoPor.nombre}
                </p>
                {ultimaModeracion && (
                  <p className="text-xs text-muted">
                    {ESTADO_LABEL[oferta.estado]} por <strong>{ultimaModeracion.moderador.nombre}</strong> el{" "}
                    {new Date(ultimaModeracion.fecha).toLocaleDateString("es-PA")}
                    {ultimaModeracion.motivo ? ` — motivo: ${ultimaModeracion.motivo}` : ""}
                  </p>
                )}
                {ultimaEdicion && (
                  <p className="text-xs text-muted">
                    Editada por <strong>{ultimaEdicion.admin.nombre}</strong> el{" "}
                    {new Date(ultimaEdicion.fecha).toLocaleDateString("es-PA")}
                  </p>
                )}
              </div>
            </li>
          );
        })}
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
