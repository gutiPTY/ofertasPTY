"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { DIA_SEMANA_LABEL, type DiaSemana } from "@ofertaspty/shared-types";

export interface OfertaDetalleData {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  precioOriginal: string | null;
  precioOferta: string | null;
  provincia: string;
  distrito: string | null;
  direccion: string | null;
  linkExterno: string | null;
  fechaInicio: string;
  fechaVencimiento: string;
  diaSemana?: DiaSemana | null;
  estado: "PENDIENTE" | "PUBLICADA" | "RECHAZADA" | "EXPIRADA" | "EN_REVISION";
  categoria: { nombre: string };
  moderaciones: { motivo: string | null }[];
}

const ESTADO_NOTA: Partial<Record<OfertaDetalleData["estado"], string>> = {
  PENDIENTE: "Todavía está esperando revisión del equipo de moderación — no es visible en el feed público.",
  EN_REVISION: "Está en revisión antifraude antes de publicarse — no es visible en el feed público.",
  EXPIRADA: "Ya venció, así que dejó de mostrarse en el feed público.",
};

export default function OfertaDetalleModal({
  oferta,
  onClose,
}: {
  oferta: OfertaDetalleData;
  onClose: () => void;
}) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const nota = ESTADO_NOTA[oferta.estado];
  const motivoRechazo = oferta.estado === "RECHAZADA" ? oferta.moderaciones[0]?.motivo : null;

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
          <Image
            src={oferta.imagenUrl}
            alt={oferta.titulo}
            fill
            sizes="(max-width: 640px) 100vw, 512px"
            className="object-contain"
          />
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
            <span className="text-xs font-bold uppercase tracking-wide text-ember">
              {oferta.categoria.nombre}
            </span>
            <h2 className="font-display text-xl font-semibold leading-tight text-ink">{oferta.titulo}</h2>
          </div>

          {oferta.precioOferta && (
            <p className="font-display text-2xl font-semibold text-ember">
              ${oferta.precioOferta}
              {oferta.precioOriginal && (
                <span className="ml-2 font-sans text-sm font-normal text-muted line-through">
                  ${oferta.precioOriginal}
                </span>
              )}
            </p>
          )}

          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{oferta.descripcion}</p>

          <div className="flex flex-col gap-1 border-t border-line pt-4 text-sm text-muted">
            <p>
              {oferta.provincia}
              {oferta.distrito ? `, ${oferta.distrito}` : ""}
              {oferta.direccion ? ` — ${oferta.direccion}` : ""}
            </p>
            <p>
              Vigente del {new Date(oferta.fechaInicio).toLocaleDateString("es-PA")} al{" "}
              {new Date(oferta.fechaVencimiento).toLocaleDateString("es-PA")}
            </p>
            {oferta.diaSemana && (
              <p className="font-semibold text-ink">Todos los {DIA_SEMANA_LABEL[oferta.diaSemana]}</p>
            )}
            {oferta.linkExterno && (
              <a
                href={oferta.linkExterno}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ember underline"
              >
                Ver más en el sitio del comercio
              </a>
            )}
          </div>

          {motivoRechazo && (
            <div className="rounded-xl bg-critical-bg p-3 text-sm text-critical">
              <span className="font-semibold">Motivo del rechazo: </span>
              {motivoRechazo}
            </div>
          )}

          {nota && !motivoRechazo && (
            <div className="rounded-xl bg-warning-bg p-3 text-sm text-warning">{nota}</div>
          )}

          {oferta.estado === "PUBLICADA" && (
            <Link
              href={`/ofertas/${oferta.slug}`}
              target="_blank"
              className="rounded-full bg-ember px-4 py-2.5 text-center text-sm font-bold text-ember-ink transition hover:brightness-95"
            >
              Ver página pública
            </Link>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
