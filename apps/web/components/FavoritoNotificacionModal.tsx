"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { DiaSemana } from "@ofertaspty/shared-types";
import { DIA_SEMANA_LABEL } from "@ofertaspty/shared-types";
import { createClient } from "@/lib/supabase/client";

export interface NotifPrefs {
  notifEmail: boolean;
  notifInterna: boolean;
  notifDiaria: boolean;
  notifElDia: boolean;
  notifUltimoDia: boolean;
  notifUnDiaAntes: boolean;
}

export default function FavoritoNotificacionModal({
  favoritoId,
  ofertaTitulo,
  diaSemana,
  prefs,
  onClose,
  onSaved,
}: {
  favoritoId: string;
  ofertaTitulo: string;
  diaSemana: DiaSemana | null | undefined;
  prefs: NotifPrefs;
  onClose: () => void;
  onSaved: (favoritoId: string, prefs: NotifPrefs) => void;
}) {
  const supabase = createClient();
  const [valores, setValores] = useState<NotifPrefs>(prefs);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function actualizar(campo: keyof NotifPrefs, checked: boolean) {
    const nuevos = { ...valores, [campo]: checked };
    setValores(nuevos);
    setGuardando(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setGuardando(false);
      return;
    }

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favoritos/${favoritoId}/notificaciones`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(nuevos),
    });
    setGuardando(false);
    onSaved(favoritoId, nuevos);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl bg-surface p-5 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Notificarme</h2>
            <p className="text-sm text-muted">{ofertaTitulo}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Por dónde</legend>
            <Casilla
              label="Email"
              checked={valores.notifEmail}
              onChange={(v) => actualizar("notifEmail", v)}
            />
            <Casilla
              label="Notificación interna (campana)"
              checked={valores.notifInterna}
              onChange={(v) => actualizar("notifInterna", v)}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Cuándo</legend>
            <Casilla
              label="Todos los días"
              checked={valores.notifDiaria}
              onChange={(v) => actualizar("notifDiaria", v)}
            />
            {diaSemana ? (
              <Casilla
                label={`El día de la promo (${DIA_SEMANA_LABEL[diaSemana]})`}
                checked={valores.notifElDia}
                onChange={(v) => actualizar("notifElDia", v)}
              />
            ) : (
              <p className="pl-7 text-xs text-muted">
                &quot;El día de la oferta&quot; no aplica: esta oferta no tiene un día fijo de la semana.
              </p>
            )}
            <Casilla
              label="Antes de vencer — último día"
              checked={valores.notifUltimoDia}
              onChange={(v) => actualizar("notifUltimoDia", v)}
            />
            <Casilla
              label="Antes de vencer — 1 día antes"
              checked={valores.notifUnDiaAntes}
              onChange={(v) => actualizar("notifUnDiaAntes", v)}
            />
          </fieldset>

          <p className="text-xs text-muted">{guardando ? "Guardando…" : "Los cambios se guardan solos."}</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Casilla({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-ember"
      />
      {label}
    </label>
  );
}
