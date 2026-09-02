import { Suspense } from "react";
import { REPUTACION_INSIGNIA_UMBRAL } from "@ofertaspty/shared-types";
import { createClient } from "@/lib/supabase/server";
import InsigniaColaboradorConfiable from "@/components/InsigniaColaboradorConfiable";
import EditarOfertaForm from "./EditarOfertaForm";
import DashboardStats from "./DashboardStats";
import HistorialOfertas from "./HistorialOfertas";
import ComerciosSection from "./ComerciosSection";
import {
  aprobarOferta,
  rechazarOferta,
  editarOferta,
  suspenderUsuario,
  verificarComercio,
  rechazarComercio,
  togglePlanPago,
} from "./actions";

interface Categoria {
  id: string;
  nombre: string;
}

interface OfertaPendiente {
  id: string;
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
  categoriaId: string;
  categoria: { nombre: string };
  creadoPor: { id: string; nombre: string; email: string; suspendido: boolean; reputacion: number };
}

interface OfertaEnRevision extends OfertaPendiente {
  reportes: { motivo: string }[];
}

interface ComercioSolicitud {
  id: string;
  nombre: string;
  direccion: string;
  ruc: string;
  direccionFiscal: string;
  representanteLegal: string;
  categoria: { nombre: string };
  usuario: { nombre: string; email: string };
}

interface ComercioVerificado {
  id: string;
  nombre: string;
  planPago: boolean;
  categoria: { nombre: string };
}

const HISTORIAL_ESTADOS = new Set(["PUBLICADA", "RECHAZADA", "EXPIRADA"]);

function StatCardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface" />
      ))}
    </div>
  );
}

function HistorialSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
      ))}
    </div>
  );
}

function ComercioSolicitudCard({ comercio }: { comercio: ComercioSolicitud }) {
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
      <p className="font-display text-sm font-semibold text-ink">{comercio.nombre}</p>
      <p className="text-sm text-muted">
        {comercio.categoria.nombre} · RUC {comercio.ruc}
      </p>
      <p className="text-xs text-muted">
        Dirección: {comercio.direccion} · Fiscal: {comercio.direccionFiscal}
      </p>
      <p className="text-xs text-muted">Representante legal: {comercio.representanteLegal}</p>
      <p className="text-xs text-muted">
        Solicitado por {comercio.usuario.nombre} ({comercio.usuario.email})
      </p>
      <a
        href={`/api/admin/comercios/${comercio.id}/documento`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit text-sm font-semibold text-ember underline"
      >
        Ver Aviso de Operaciones
      </a>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <form action={verificarComercio.bind(null, comercio.id)}>
          <button
            type="submit"
            className="rounded-full bg-ember px-4 py-1.5 text-sm font-bold text-ember-ink transition hover:brightness-95"
          >
            Verificar
          </button>
        </form>
        <form action={rechazarComercio.bind(null, comercio.id)} className="flex gap-2">
          <input
            name="motivo"
            placeholder="Motivo del rechazo"
            required
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full border border-line px-4 py-1.5 text-sm font-bold text-ink transition hover:border-critical hover:text-critical"
          >
            Rechazar
          </button>
        </form>
      </div>
    </li>
  );
}

function OfertaCard({
  oferta,
  reportes,
  categorias,
}: {
  oferta: OfertaPendiente;
  reportes?: { motivo: string }[];
  categorias: Categoria[];
}) {
  return (
    <li className="flex gap-4 rounded-2xl border border-line bg-surface p-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- URL externa (Supabase Storage), panel interno de bajo tráfico */}
      <img src={oferta.imagenUrl} alt={oferta.titulo} className="h-24 w-24 rounded-xl object-cover" />
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-display text-sm font-semibold text-ink">{oferta.titulo}</p>
        <p className="text-sm text-muted">{oferta.descripcion}</p>
        <p className="text-xs text-muted">
          {oferta.categoria.nombre} · {oferta.provincia} · vence{" "}
          {new Date(oferta.fechaVencimiento).toLocaleDateString("es-PA")}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          Publicado por {oferta.creadoPor.nombre} ({oferta.creadoPor.email})
          {oferta.creadoPor.reputacion >= REPUTACION_INSIGNIA_UMBRAL && <InsigniaColaboradorConfiable />}
        </p>
        {reportes && reportes.length > 0 && (
          <p className="text-xs text-critical">
            {reportes.length} reporte{reportes.length === 1 ? "" : "s"}:{" "}
            {reportes.map((r) => r.motivo).join(" · ")}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <form action={aprobarOferta.bind(null, oferta.id)}>
            <button
              type="submit"
              className="rounded-full bg-ember px-4 py-1.5 text-sm font-bold text-ember-ink transition hover:brightness-95"
            >
              Aprobar
            </button>
          </form>
          <form action={rechazarOferta.bind(null, oferta.id)} className="flex gap-2">
            <input
              name="motivo"
              placeholder="Motivo (opcional)"
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full border border-line px-4 py-1.5 text-sm font-bold text-ink transition hover:border-critical hover:text-critical"
            >
              Rechazar
            </button>
          </form>
          <form action={suspenderUsuario.bind(null, oferta.creadoPor.id)}>
            <button
              type="submit"
              className="rounded-full border border-line px-4 py-1.5 text-sm font-bold text-critical transition hover:bg-critical-bg"
            >
              {oferta.creadoPor.suspendido ? "Reactivar autor" : "Suspender autor"}
            </button>
          </form>
          <EditarOfertaForm
            oferta={oferta}
            categorias={categorias}
            action={editarOferta.bind(null, oferta.id)}
          />
        </div>
      </div>
    </li>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { historialEstado?: string; historialPage?: string };
}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [pendientesRes, enRevisionRes, comerciosPendientesRes, comerciosVerificadosRes, categoriasRes] =
    await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ofertas/pendientes`, {
        headers: { Authorization: `Bearer ${session!.access_token}` },
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/ofertas/en-revision`, {
        headers: { Authorization: `Bearer ${session!.access_token}` },
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/comercios/pendientes`, {
        headers: { Authorization: `Bearer ${session!.access_token}` },
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/comercios/verificados`, {
        headers: { Authorization: `Bearer ${session!.access_token}` },
        cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/categorias`, { cache: "no-store" }),
    ]);
  const { ofertas } = (await pendientesRes.json()) as { ofertas: OfertaPendiente[] };
  const { categorias } = (await categoriasRes.json()) as { categorias: Categoria[] };
  const { ofertas: ofertasEnRevision } = (await enRevisionRes.json()) as {
    ofertas: OfertaEnRevision[];
  };
  const { comercios: comerciosPendientes } = (await comerciosPendientesRes.json()) as {
    comercios: ComercioSolicitud[];
  };
  const { comercios: comerciosVerificados } = (await comerciosVerificadosRes.json()) as {
    comercios: ComercioVerificado[];
  };

  const historialEstado = (
    HISTORIAL_ESTADOS.has(searchParams.historialEstado ?? "") ? searchParams.historialEstado : "PUBLICADA"
  ) as "PUBLICADA" | "RECHAZADA" | "EXPIRADA";
  const historialPage = Number(searchParams.historialPage ?? "1") || 1;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Panel de administración</h1>

      <Suspense fallback={<StatCardSkeleton />}>
        <DashboardStats />
      </Suspense>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold text-ink">Cola de moderación ({ofertas.length})</h2>
        {ofertas.length === 0 && <p className="text-sm text-muted">No hay ofertas pendientes.</p>}
        <ul className="flex flex-col gap-4">
          {ofertas.map((oferta) => (
            <OfertaCard key={oferta.id} oferta={oferta} categorias={categorias} />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold text-ink">
          Ofertas reportadas en revisión ({ofertasEnRevision.length})
        </h2>
        {ofertasEnRevision.length === 0 && <p className="text-sm text-muted">No hay ofertas en revisión.</p>}
        <ul className="flex flex-col gap-4">
          {ofertasEnRevision.map((oferta) => (
            <OfertaCard key={oferta.id} oferta={oferta} reportes={oferta.reportes} categorias={categorias} />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold text-ink">Historial de moderación</h2>
        <Suspense fallback={<HistorialSkeleton />}>
          <HistorialOfertas estado={historialEstado} page={historialPage} />
        </Suspense>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold text-ink">
          Solicitudes de comercio pendientes ({comerciosPendientes.length})
        </h2>
        {comerciosPendientes.length === 0 && (
          <p className="text-sm text-muted">No hay solicitudes pendientes.</p>
        )}
        <ul className="flex flex-col gap-4">
          {comerciosPendientes.map((comercio) => (
            <ComercioSolicitudCard key={comercio.id} comercio={comercio} />
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold text-ink">
          Comercios verificados ({comerciosVerificados.length})
        </h2>
        <ComerciosSection comercios={comerciosVerificados} togglePlanPago={togglePlanPago} />
      </section>
    </main>
  );
}
