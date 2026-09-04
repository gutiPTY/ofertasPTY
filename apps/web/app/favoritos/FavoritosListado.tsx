"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CategoriaIcon, { categoriaColor } from "@/components/CategoriaIcon";
import OfertaDetalleModal, { type OfertaDetalleData } from "@/components/OfertaDetalleModal";
import FavoritoNotificacionModal, { type NotifPrefs } from "@/components/FavoritoNotificacionModal";
import { ESTADO_BADGE, ESTADO_LABEL } from "@/lib/ofertaEstado";

export interface FavoritoConOferta extends NotifPrefs {
  id: string;
  oferta: OfertaDetalleData;
}

const CAMPANA_ACTIVA_PATH =
  "M6 9a6 6 0 1 1 12 0c0 3.5 1 5 2 6H4c1-1 2-2.5 2-6Z";

export default function FavoritosListado({ favoritos: favoritosIniciales }: { favoritos: FavoritoConOferta[] }) {
  const [favoritos, setFavoritos] = useState(favoritosIniciales);
  const [detalle, setDetalle] = useState<OfertaDetalleData | null>(null);
  const [notifFavorito, setNotifFavorito] = useState<FavoritoConOferta | null>(null);

  const grupos = useMemo(() => {
    const porCategoria = new Map<string, FavoritoConOferta[]>();
    for (const favorito of favoritos) {
      const nombre = favorito.oferta.categoria.nombre;
      const lista = porCategoria.get(nombre) ?? [];
      lista.push(favorito);
      porCategoria.set(nombre, lista);
    }
    return [...porCategoria.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
  }, [favoritos]);

  function onNotifGuardada(favoritoId: string, prefs: NotifPrefs) {
    setFavoritos((actual) => actual.map((f) => (f.id === favoritoId ? { ...f, ...prefs } : f)));
  }

  if (favoritos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface py-16 text-center">
        <p className="text-muted">Todavía no guardaste ninguna oferta como favorita.</p>
        <Link
          href="/"
          className="rounded-full bg-ember px-4 py-2 text-sm font-bold text-ember-ink transition hover:brightness-95"
        >
          Explorar ofertas
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {grupos.map(([categoria, favoritosCategoria]) => {
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
              <span className="text-sm text-muted">({favoritosCategoria.length})</span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {favoritosCategoria.map((favorito) => {
                const { oferta } = favorito;
                const notifActiva =
                  favorito.notifEmail ||
                  favorito.notifInterna ||
                  favorito.notifDiaria ||
                  favorito.notifElDia ||
                  favorito.notifUltimoDia ||
                  favorito.notifUnDiaAntes;

                return (
                  <div
                    key={favorito.id}
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
                      {oferta.estado !== "PUBLICADA" && (
                        <span
                          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${ESTADO_BADGE[oferta.estado]}`}
                        >
                          {ESTADO_LABEL[oferta.estado]}
                        </span>
                      )}
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
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetalle(oferta)}
                          className="flex-1 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-ink transition hover:border-ember hover:text-ember"
                        >
                          Ver oferta
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifFavorito(favorito)}
                          aria-label="Configurar notificaciones"
                          title="Notificarme"
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                            notifActiva
                              ? "border-ember bg-ember text-ember-ink"
                              : "border-line text-ink hover:border-ember hover:text-ember"
                          }`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                            <path
                              d={CAMPANA_ACTIVA_PATH}
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M9.5 18a2.5 2.5 0 0 0 5 0"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {detalle && <OfertaDetalleModal oferta={detalle} onClose={() => setDetalle(null)} />}

      {notifFavorito && (
        <FavoritoNotificacionModal
          favoritoId={notifFavorito.id}
          ofertaTitulo={notifFavorito.oferta.titulo}
          diaSemana={notifFavorito.oferta.diaSemana}
          prefs={{
            notifEmail: notifFavorito.notifEmail,
            notifInterna: notifFavorito.notifInterna,
            notifDiaria: notifFavorito.notifDiaria,
            notifElDia: notifFavorito.notifElDia,
            notifUltimoDia: notifFavorito.notifUltimoDia,
            notifUnDiaAntes: notifFavorito.notifUnDiaAntes,
          }}
          onClose={() => setNotifFavorito(null)}
          onSaved={onNotifGuardada}
        />
      )}
    </div>
  );
}
