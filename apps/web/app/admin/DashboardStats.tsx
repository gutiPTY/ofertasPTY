import { createClient } from "@/lib/supabase/server";
import { ESTADO_LABEL } from "@/lib/ofertaEstado";

interface Stats {
  ofertasPorEstado: Record<string, number>;
  usuarios: { total: number; sinOfertas: number; conUna: number; conCincoOMas: number };
}

const ORDEN_ESTADOS = ["PENDIENTE", "EN_REVISION", "PUBLICADA", "RECHAZADA", "EXPIRADA"] as const;

function StatCard({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="font-display text-2xl font-semibold text-ink">{valor}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

// Server component async independiente — se monta en su propio Suspense
// boundary desde page.tsx para que, aunque este query se vuelva pesado a
// futuro, nunca bloquee el render de las colas de moderación (lo más
// importante de la página).
export default async function DashboardStats() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/stats`, {
    headers: { Authorization: `Bearer ${session!.access_token}` },
    cache: "no-store",
  });
  const stats = (await res.json()) as Stats;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Ofertas por estado</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {ORDEN_ESTADOS.map((estado) => (
            <StatCard key={estado} label={ESTADO_LABEL[estado]} valor={stats.ofertasPorEstado[estado] ?? 0} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Usuarios</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Registrados" valor={stats.usuarios.total} />
          <StatCard label="Sin ofertas publicadas" valor={stats.usuarios.sinOfertas} />
          <StatCard label="Con 1 oferta publicada" valor={stats.usuarios.conUna} />
          <StatCard label="Con 5+ ofertas publicadas" valor={stats.usuarios.conCincoOMas} />
        </div>
      </div>
    </div>
  );
}
