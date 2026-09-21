"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";

// Solo hace falta para usuarios con sesión — separarlo evita que su código
// (y el fetch inicial a /notificaciones/mine) se descargue para el resto de
// las visitas anónimas, que son la mayoría (Lighthouse: unused-javascript).
const NotificacionesBell = dynamic(() => import("@/components/NotificacionesBell"), {
  ssr: false,
});

interface SesionHeader {
  email: string;
  role: string | null;
}

export default function Header() {
  const [sesion, setSesion] = useState<SesionHeader | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let vigente = true;

    async function obtenerRol(accessToken: string) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => null);
      if (!res?.ok) return null;
      return (await res.json()).role ?? null;
    }

    async function sincronizar(session: Session | null) {
      if (!session) {
        if (vigente) setSesion(null);
        return;
      }
      const role = await obtenerRol(session.access_token);
      if (vigente) setSesion({ email: session.user.email ?? "", role });
    }

    supabase.auth.getSession().then(({ data }) => sincronizar(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      sincronizar(session);
    });

    return () => {
      vigente = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="border-b border-line bg-paper">
      <div className="border-b border-line bg-surface-2">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-4 px-4 py-1.5 text-xs text-muted sm:px-6">
          {sesion ? (
            <>
              <Link href="/mis-ofertas" className="hover:text-ink">
                Mis ofertas
              </Link>
              <Link href="/favoritos" className="hover:text-ink">
                Favoritos
              </Link>
              <Link href="/comercio/solicitud" className="hover:text-ink">
                Mi comercio
              </Link>
              <Link href="/perfil" className="hover:text-ink">
                Mi perfil
              </Link>
              {sesion.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-ink">
                  Panel admin
                </Link>
              )}
              <span>{sesion.email}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-ink">
                Ingresar
              </Link>
              <Link href="/registro" className="font-semibold hover:text-ink">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-4 sm:px-6">
        <Logo />

        {sesion && <NotificacionesBell />}

        <Link
          href="/publicar"
          className="ml-auto shrink-0 rounded-full bg-ember px-4 py-2 text-sm font-bold text-ember-ink transition hover:brightness-95"
        >
          Publicar oferta
        </Link>
      </div>
    </div>
  );
}
