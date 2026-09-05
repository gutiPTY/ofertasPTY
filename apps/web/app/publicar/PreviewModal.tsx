"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { DIA_SEMANA_LABEL, type DiaSemana } from "@ofertaspty/shared-types";
import { categoriaColor } from "@/components/CategoriaIcon";

export interface PreviewData {
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  precioOriginal: string;
  precioOferta: string;
  porcentajeDescuento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  linkExterno: string;
  fechaInicio: string;
  fechaVencimiento: string;
  categoriaNombre: string;
  diaSemana: string;
}

function formatFecha(value: string) {
  if (!value) return null;
  const fecha = new Date(`${value}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleDateString("es-PA", { day: "numeric", month: "long", year: "numeric" });
}

export default function PreviewModal({ data, onClose }: { data: PreviewData; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const { bg, fg } = categoriaColor(data.categoriaNombre);
  const vigenciaDesde = formatFecha(data.fechaInicio);
  const vigenciaHasta = formatFecha(data.fechaVencimiento);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-y-auto rounded-t-3xl bg-surface sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-surface-2">
          {data.imagenUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- object URL local, todavia no existe en Storage
            <img src={data.imagenUrl} alt={data.titulo} className="h-full w-full object-contain" />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-paper">
            Vista previa
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div>
            {data.categoriaNombre && (
              <span
                className="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide"
                style={{ backgroundColor: bg, color: fg }}
              >
                {data.categoriaNombre}
              </span>
            )}
            <h2 className="font-display text-xl font-semibold leading-tight text-ink">
              {data.titulo || "Sin título todavía"}
            </h2>
          </div>

          {data.precioOferta ? (
            <p className="font-display text-2xl font-semibold text-ember">
              ${data.precioOferta}
              {data.precioOriginal && (
                <span className="ml-2 font-sans text-sm font-normal text-muted line-through">
                  ${data.precioOriginal}
                </span>
              )}
              {data.porcentajeDescuento && (
                <span className="ml-2 rounded-full bg-ember px-2 py-0.5 align-middle text-xs font-bold text-ember-ink">
                  -{data.porcentajeDescuento}%
                </span>
              )}
            </p>
          ) : (
            data.porcentajeDescuento && (
              <p className="font-display text-2xl font-semibold text-ember">
                {data.porcentajeDescuento}% de descuento
              </p>
            )
          )}

          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
            {data.descripcion || "Sin descripción todavía."}
          </p>

          <div className="flex flex-col gap-1 border-t border-line pt-4 text-sm text-muted">
            <p>
              {data.provincia || "Provincia sin elegir"}
              {data.distrito ? `, ${data.distrito}` : ""}
              {data.direccion ? ` — ${data.direccion}` : ""}
            </p>
            {vigenciaDesde && vigenciaHasta && (
              <p>
                Vigente del {vigenciaDesde} al {vigenciaHasta}
              </p>
            )}
            {data.diaSemana && (
              <p className="font-semibold text-ink">
                Todos los {DIA_SEMANA_LABEL[data.diaSemana as DiaSemana]}
              </p>
            )}
            {data.linkExterno && (
              <a
                href={data.linkExterno}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ember underline"
              >
                Ver más en el sitio del comercio
              </a>
            )}
          </div>

          <div className="rounded-xl bg-warning-bg p-3 text-sm text-warning">
            Así se va a ver una vez aprobada. Todavía no se envió nada.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-4 py-2.5 text-center text-sm font-bold text-ink transition hover:border-ember hover:text-ember"
          >
            Seguir editando
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
