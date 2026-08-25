import { createClient } from "@/lib/supabase/server";
import { aprobarOferta, rechazarOferta, suspenderUsuario } from "./actions";

interface OfertaPendiente {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  provincia: string;
  fechaVencimiento: string;
  categoria: { nombre: string };
  creadoPor: { id: string; nombre: string; email: string; suspendido: boolean };
}

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ofertas/pendientes`, {
    headers: { Authorization: `Bearer ${session!.access_token}` },
    cache: "no-store",
  });
  const { ofertas } = (await res.json()) as { ofertas: OfertaPendiente[] };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Cola de moderación ({ofertas.length})</h1>
      {ofertas.length === 0 && <p className="text-neutral-600">No hay ofertas pendientes.</p>}
      <ul className="flex flex-col gap-4">
        {ofertas.map((oferta) => (
          <li key={oferta.id} className="flex gap-4 rounded border p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (Supabase Storage), panel interno de bajo tráfico */}
            <img
              src={oferta.imagenUrl}
              alt={oferta.titulo}
              className="h-24 w-24 rounded object-cover"
            />
            <div className="flex flex-1 flex-col gap-1">
              <p className="font-medium">{oferta.titulo}</p>
              <p className="text-sm text-neutral-600">{oferta.descripcion}</p>
              <p className="text-xs text-neutral-500">
                {oferta.categoria.nombre} · {oferta.provincia} · vence{" "}
                {new Date(oferta.fechaVencimiento).toLocaleDateString("es-PA")}
              </p>
              <p className="text-xs text-neutral-500">
                Publicado por {oferta.creadoPor.nombre} ({oferta.creadoPor.email})
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <form action={aprobarOferta.bind(null, oferta.id)}>
                  <button type="submit" className="rounded bg-black px-3 py-1.5 text-sm text-white">
                    Aprobar
                  </button>
                </form>
                <form action={rechazarOferta.bind(null, oferta.id)} className="flex gap-2">
                  <input
                    name="motivo"
                    placeholder="Motivo (opcional)"
                    className="rounded border px-2 py-1.5 text-sm"
                  />
                  <button type="submit" className="rounded border px-3 py-1.5 text-sm">
                    Rechazar
                  </button>
                </form>
                <form action={suspenderUsuario.bind(null, oferta.creadoPor.id)}>
                  <button type="submit" className="rounded border px-3 py-1.5 text-sm text-red-600">
                    {oferta.creadoPor.suspendido ? "Reactivar autor" : "Suspender autor"}
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
