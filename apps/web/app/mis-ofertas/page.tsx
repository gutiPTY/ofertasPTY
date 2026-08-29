import { redirect } from "next/navigation";
import { REPUTACION_INSIGNIA_UMBRAL } from "@ofertaspty/shared-types";
import { createClient } from "@/lib/supabase/server";
import InsigniaColaboradorConfiable from "@/components/InsigniaColaboradorConfiable";

interface Usuario {
  reputacion: number;
}

interface OfertaConModeracion {
  id: string;
  titulo: string;
  imagenUrl: string;
  estado: "PENDIENTE" | "PUBLICADA" | "RECHAZADA" | "EXPIRADA" | "EN_REVISION";
  creadoEn: string;
  categoria: { nombre: string };
  moderaciones: { motivo: string | null }[];
}

const ESTADO_LABEL: Record<OfertaConModeracion["estado"], string> = {
  PENDIENTE: "Pendiente",
  PUBLICADA: "Publicada",
  RECHAZADA: "Rechazada",
  EXPIRADA: "Expirada",
  EN_REVISION: "En revisión",
};

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
  const { ofertas } = (await ofertasRes.json()) as { ofertas: OfertaConModeracion[] };
  const { usuario } = (await meRes.json()) as { usuario: Usuario };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Mis ofertas</h1>
        <div className="flex items-center gap-1.5 text-sm text-neutral-600">
          <span>{usuario.reputacion} pts</span>
          {usuario.reputacion >= REPUTACION_INSIGNIA_UMBRAL && <InsigniaColaboradorConfiable />}
        </div>
      </div>
      {ofertas.length === 0 && <p className="text-neutral-600">Todavía no publicaste ninguna oferta.</p>}
      <ul className="flex flex-col gap-3">
        {ofertas.map((oferta) => (
          <li key={oferta.id} className="rounded border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{oferta.titulo}</span>
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs">
                {ESTADO_LABEL[oferta.estado]}
              </span>
            </div>
            <p className="text-sm text-neutral-500">{oferta.categoria.nombre}</p>
            {oferta.estado === "RECHAZADA" && oferta.moderaciones[0]?.motivo && (
              <p className="mt-1 text-sm text-red-600">Motivo: {oferta.moderaciones[0].motivo}</p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
