"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface NotificacionItem {
  id: string;
  mensaje: string;
  ofertaSlug: string | null;
  leida: boolean;
  creadoEn: string;
}

export default function NotificacionesBell() {
  const supabase = createClient();
  const [abierto, setAbierto] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[] | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const getToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, [supabase]);

  useEffect(() => {
    getToken().then(async (token) => {
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notificaciones/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNoLeidas(data.noLeidas ?? 0);
    });
  }, [getToken]);

  useEffect(() => {
    function onClickFuera(event: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  async function toggleAbierto() {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (!siguiente) return;

    const token = await getToken();
    if (!token) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notificaciones/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setNotificaciones(data.notificaciones ?? []);

    // Se decide con el dato recién llegado del fetch, no con el estado
    // `noLeidas` por closure — ese puede quedar obsoleto (p.ej. bajo
    // Strict Mode, que invoca el efecto de montaje dos veces en dev).
    if ((data.noLeidas ?? 0) > 0) {
      setNoLeidas(0);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notificaciones/marcar-leidas`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  }

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={toggleAbierto}
        aria-label="Notificaciones"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-surface-2"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M6 9a6 6 0 1 1 12 0c0 3.5 1 5 2 6H4c1-1 2-2.5 2-6Z"
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
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-ember-ink">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
          <div className="border-b border-line px-4 py-3">
            <span className="font-display text-sm font-semibold text-ink">Notificaciones</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notificaciones === null && (
              <p className="p-4 text-sm text-muted">Cargando…</p>
            )}
            {notificaciones !== null && notificaciones.length === 0 && (
              <p className="p-4 text-sm text-muted">No tenés notificaciones todavía.</p>
            )}
            {notificaciones?.map((n) => {
              const contenido = (
                <div className="flex items-start gap-2 px-4 py-3">
                  {!n.leida && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />}
                  <div className={`flex flex-1 flex-col gap-0.5 ${n.leida ? "pl-3.5" : ""}`}>
                    <span className="text-sm text-ink">{n.mensaje}</span>
                    <span className="text-xs text-muted">
                      {new Date(n.creadoEn).toLocaleDateString("es-PA", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
              return n.ofertaSlug ? (
                <Link
                  key={n.id}
                  href={`/ofertas/${n.ofertaSlug}`}
                  className="block border-b border-line last:border-0 hover:bg-surface-2"
                >
                  {contenido}
                </Link>
              ) : (
                <div key={n.id} className="border-b border-line last:border-0">
                  {contenido}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
