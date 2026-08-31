import Link from "next/link";
import { redirect } from "next/navigation";
import { REPUTACION_INSIGNIA_UMBRAL } from "@ofertaspty/shared-types";
import { createClient } from "@/lib/supabase/server";
import InsigniaColaboradorConfiable from "@/components/InsigniaColaboradorConfiable";
import type { OfertaDetalleData } from "@/components/OfertaDetalleModal";
import MisOfertasListado from "./MisOfertasListado";

interface Usuario {
  reputacion: number;
}

export default async function MisOfertasPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const [ofertasRes, meRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/ofertas/mine`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    }),
  ]);
  const { ofertas } = (await ofertasRes.json()) as { ofertas: OfertaDetalleData[] };
  // meRes puede ser 404 "usuario_no_sincronizado" si el usuario nunca
  // pasó por /auth/sync (ver login/page.tsx) — no asumir que existe.
  const usuario: Usuario | null = meRes.ok
    ? ((await meRes.json()) as { usuario: Usuario }).usuario
    : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Mis ofertas</h1>
          <p className="text-sm text-muted">
            {ofertas.length} {ofertas.length === 1 ? "oferta publicada" : "ofertas publicadas"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {usuario && (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <span>{usuario.reputacion} pts</span>
              {usuario.reputacion >= REPUTACION_INSIGNIA_UMBRAL && <InsigniaColaboradorConfiable />}
            </div>
          )}
          <Link
            href="/publicar"
            className="rounded-full bg-ember px-4 py-2 text-sm font-bold text-ember-ink transition hover:brightness-95"
          >
            Publicar oferta
          </Link>
        </div>
      </div>

      <MisOfertasListado ofertas={ofertas} />
    </main>
  );
}
