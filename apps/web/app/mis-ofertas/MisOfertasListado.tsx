"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import CategoriaIcon, { categoriaColor } from "@/components/CategoriaIcon";
import OfertaDetalleModal, { type OfertaDetalleData } from "@/components/OfertaDetalleModal";

type Estado = OfertaDetalleData["estado"];

const ESTADO_LABEL: Record<Estado, string> = {
  PENDIENTE: "Pendiente",
  PUBLICADA: "Publicada",
  RECHAZADA: "Rechazada",
  EXPIRADA: "Expirada",
  EN_REVISION: "En revisión",
};

const ESTADO_BADGE: Record<Estado, string> = {
  PENDIENTE: "bg-warning-bg text-warning",
  EN_REVISION: "bg-warning-bg text-warning",
  PUBLICADA: "bg-success-bg text-success",
  RECHAZADA: "bg-critical-bg text-critical",
  EXPIRADA: "bg-surface-2 text-muted",
};

export default function MisOfertasListado({ ofertas }: { ofertas: OfertaDetalleData[] }) {
  const [seleccionada, setSeleccionada] = useState<OfertaDetalleData | null>(null);

  const grupos = useMemo(() => {
    const porCategoria = new Map<string, OfertaDetalleData[]>();
    for (const oferta of ofertas) {
      const nombre = oferta.categoria.nombre;
      const lista = porCategoria.get(nombre) ?? [];
      lista.push(oferta);
      porCategoria.set(nombre, lista);
    }
    return [...porCategoria.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
  }, [ofertas]);

  if (ofertas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface py-16 text-center">
        <p className="text-muted">Todavía no publicaste ninguna oferta.</p>
        <a
          href="/publicar"
          className="rounded-full bg-ember px-4 py-2 text-sm font-bold text-ember-ink transition hover:brightness-95"
        >
          Publicar mi primera oferta
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {grupos.map(([categoria, ofertasCategoria]) => {
        const { bg } = categoriaColor(categoria);
        return (
          <section key={categoria} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: bg }}
              >
                <CategoriaIcon nombre={categoria} className="h-5 w-5" />
              </span>
              <h2 className="font-display text-lg font-semibold text-ink">{categoria}</h2>
              <span className="text-sm text-muted">({ofertasCategoria.length})</span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {ofertasCategoria.map((oferta) => (
                <div
                  key={oferta.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
                    <Image
                      src={oferta.imagenUrl}
                      alt={oferta.titulo}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover object-top"
                    />
                    <span
                      className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${ESTADO_BADGE[oferta.estado]}`}
                    >
                      {ESTADO_LABEL[oferta.estado]}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <span className="font-display text-sm font-semibold leading-snug text-ink">
                      {oferta.titulo}
                    </span>
                    {oferta.precioOferta && (
                      <span className="font-display text-base font-semibold text-ember">
                        ${oferta.precioOferta}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setSeleccionada(oferta)}
                      className="mt-auto rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink transition hover:border-ember hover:text-ember"
                    >
                      Ver oferta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {seleccionada && (
        <OfertaDetalleModal oferta={seleccionada} onClose={() => setSeleccionada(null)} />
      )}
    </div>
  );
}
