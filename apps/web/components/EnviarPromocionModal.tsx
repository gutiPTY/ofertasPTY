"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { EnviarPromocionComerciosInputSchema } from "@ofertaspty/shared-types";
import { createClient } from "@/lib/supabase/client";

export default function EnviarPromocionModal({
  destinatarios,
  onClose,
}: {
  destinatarios: { id: string; nombre: string }[];
  onClose: () => void;
}) {
  const supabase = createClient();
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function enviar() {
    setError(null);
    const parsed = EnviarPromocionComerciosInputSchema.safeParse({
      comercioIds: destinatarios.map((d) => d.id),
      asunto,
      mensaje,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    setEnviando(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError("Tu sesión expiró, volvé a iniciar sesión.");
      setEnviando(false);
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/comercios/enviar-promocion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(parsed.data),
    });
    setEnviando(false);

    if (!res.ok) {
      setError("No se pudo enviar la promoción. Intentá de nuevo en un momento.");
      return;
    }
    setEnviado(true);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-surface sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-3">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-muted">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-sm font-semibold text-ink">Enviar promoción</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {enviado ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="font-display text-base font-semibold text-ink">Promoción enviada</p>
            <p className="text-sm text-muted">
              Se mandó un email individual a cada uno de los {destinatarios.length}{" "}
              {destinatarios.length === 1 ? "comercio" : "comercios"} seleccionados.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-full bg-ember px-4 py-2 text-sm font-bold text-ember-ink transition hover:brightness-95"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex flex-col gap-1 border-b border-line px-5 py-3 text-sm">
              <span className="text-muted">Para</span>
              <p className="text-ink">
                {destinatarios.length} {destinatarios.length === 1 ? "comercio" : "comercios"}:{" "}
                {destinatarios.map((d) => d.nombre).join(", ")}
              </p>
            </div>
            <input
              value={asunto}
              onChange={(event) => setAsunto(event.target.value)}
              placeholder="Asunto — ej. Nueva promo destacada disponible"
              className="border-b border-line bg-transparent px-5 py-3 text-sm font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted"
            />
            <textarea
              value={mensaje}
              onChange={(event) => setMensaje(event.target.value)}
              placeholder="Escribe el mensaje que va a recibir cada comercio…"
              rows={7}
              className="resize-none bg-transparent px-5 py-4 text-sm text-ink outline-none placeholder:text-muted"
            />

            {error && <p className="px-5 pb-2 text-sm text-critical">{error}</p>}

            <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-line px-4 py-2 text-sm font-bold text-ink transition hover:border-ember hover:text-ember"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={enviar}
                disabled={enviando || destinatarios.length === 0}
                className="rounded-full bg-ember px-4 py-2 text-sm font-bold text-ember-ink transition hover:brightness-95 disabled:opacity-50"
              >
                {enviando ? "Enviando…" : `Enviar a ${destinatarios.length}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
