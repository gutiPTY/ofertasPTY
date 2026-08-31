import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FavoritosListado, { type FavoritoConOferta } from "./FavoritosListado";

export default async function FavoritosPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favoritos/mine`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });
  // res puede ser 404 "usuario_no_sincronizado" si el usuario nunca pasó
  // por /auth/sync (ver login/page.tsx) — no asumir que la respuesta trae favoritos.
  const favoritos = res.ok ? ((await res.json()) as { favoritos: FavoritoConOferta[] }).favoritos : [];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Mis favoritos</h1>
        <p className="text-sm text-muted">
          {favoritos.length} {favoritos.length === 1 ? "oferta guardada" : "ofertas guardadas"}
        </p>
      </div>

      <FavoritosListado favoritos={favoritos} />
    </main>
  );
}
